/**
 * PDF renderer — prints the SAME React template the user sees in the builder.
 *
 *   backend ──(inject resume JSON)──► headless Chromium ──► <frontend>/print ──► page.pdf()
 *
 * Why this design (it is how production resume builders do it):
 *  - One source of truth: the React template components. No second copy of the design to drift.
 *  - Real vector PDF: selectable/searchable text (ATS-readable), sharp at any zoom, small file.
 *  - Real pagination done by the browser print engine (no screenshot slicing through text).
 *  - Resume data is injected by the server from the DB (never taken from the client), and the
 *    page is not allowed to load anything outside the frontend origin.
 */
const puppeteer = require('puppeteer');

const printBaseUrl = () =>
  (process.env.PRINT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const MAX_CONCURRENT = Math.max(1, Number(process.env.PDF_MAX_CONCURRENCY) || 3);
const TIMEOUT_MS = Math.max(5000, Number(process.env.PDF_TIMEOUT_MS) || 30000);

/* ── one shared browser, relaunched automatically if it ever dies ───────────── */
let browserPromise = null;

async function getBrowser() {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.connected ?? existing.isConnected()) return existing;
    } catch (_) { /* fall through and relaunch */ }
    browserPromise = null;
  }
  const args = ['--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'];
  // Required inside most Docker/CI containers (they run as root). Disable with PUPPETEER_NO_SANDBOX=false.
  if (process.env.PUPPETEER_NO_SANDBOX !== 'false') args.push('--no-sandbox', '--disable-setuid-sandbox');

  browserPromise = puppeteer
    .launch({ headless: true, args, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined })
    .then((browser) => {
      browser.on('disconnected', () => { browserPromise = null; });
      return browser;
    })
    .catch((error) => { browserPromise = null; throw error; });
  return browserPromise;
}

async function closeBrowser() {
  if (!browserPromise) return;
  const pending = browserPromise;
  browserPromise = null;
  try { await (await pending).close(); } catch (_) { /* already closed */ }
}

/* ── tiny semaphore so a burst of exports can't exhaust memory ─────────────── */
let active = 0;
const waiting = [];
const acquire = () => (active < MAX_CONCURRENT
  ? (active += 1, Promise.resolve())
  : new Promise((resolve) => waiting.push(resolve)));
const release = () => {
  const next = waiting.shift();
  if (next) next(); else active -= 1;
};

/**
 * @param {object} payload  result of toPrintPayload(resume)
 * @returns {Promise<Buffer>} PDF bytes
 */
async function renderResumePDF(payload) {
  await acquire();
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    const base = printBaseUrl();
    const allowedOrigin = new URL(base).origin;

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith(allowedOrigin)) request.continue();
      else request.abort('blockedbyclient');
    });

    await page.evaluateOnNewDocument((data) => { window.__RESUME_PRINT_DATA__ = data; }, payload);
    await page.goto(`${base}/print`, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForFunction(
      'window.__RESUME_PRINT_READY__ === true || !!window.__RESUME_PRINT_ERROR__',
      { timeout: TIMEOUT_MS }
    );
    const renderError = await page.evaluate(() => window.__RESUME_PRINT_ERROR__ || null);
    if (renderError) throw new Error(`Print page failed: ${renderError}`);

    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      preferCSSPageSize: true, // page size + margins come from the template's @page rules
      printBackground: true,   // keep sidebars / banners / tinted panels
      timeout: TIMEOUT_MS,
    });
    return Buffer.from(pdf);
  } finally {
    if (page) await page.close().catch(() => {});
    release();
  }
}

module.exports = { renderResumePDF, closeBrowser };
