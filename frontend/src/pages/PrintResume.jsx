import React, { useEffect, useMemo } from 'react';
import ResumePreview, { PANEL_LAYOUTS, resolveLayoutKey } from '../components/resume/ResumePreview';

/**
 * /print — render target for the server-side PDF export (headless Chromium).
 *
 * It renders the SAME <ResumePreview> the builder shows, so the PDF can never drift from
 * the on-screen template. The backend injects the resume JSON as `window.__RESUME_PRINT_DATA__`
 * before this page loads (nothing is fetched, nothing is trusted from the browser), then waits for
 * `window.__RESUME_PRINT_READY__` (set once web fonts are loaded and the layout has settled).
 *
 * Opening /print in a normal browser tab simply shows "No resume data" — it exposes nothing.
 */
export default function PrintResume() {
  const payload = typeof window !== 'undefined' ? window.__RESUME_PRINT_DATA__ : null;

  const view = useMemo(() => {
    if (!payload) return null;
    const customization = payload.customization || {};
    const layoutKey = resolveLayoutKey({ customization });
    // A custom section order uses the generic single-column renderer, which has no side panels.
    const panel = !customization.customSectionOrder && PANEL_LAYOUTS.includes(layoutKey);
    return { customization, panel, sections: payload.sections || [], title: payload.title };
  }, [payload]);

  useEffect(() => {
    if (!view) {
      window.__RESUME_PRINT_ERROR__ = 'No resume data was injected into the print page.';
      return undefined;
    }
    document.title = view.title || 'Resume';
    let cancelled = false;
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

    (async () => {
      try {
        // Fonts are requested lazily when text is laid out. Wait two frames so the requests exist,
        // then wait for every pending font to finish loading before the PDF is captured.
        await nextFrame();
        await nextFrame();
        const family = view.customization.font;
        if (family && document.fonts?.load) {
          await Promise.all(
            ['400', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 1em "${family}"`, 'Aa'))
          ).catch(() => {});
        }
        await document.fonts?.ready;
        await nextFrame();
        if (!cancelled) window.__RESUME_PRINT_READY__ = true;
      } catch (error) {
        if (!cancelled) window.__RESUME_PRINT_ERROR__ = String(error?.message || error);
      }
    })();
    return () => { cancelled = true; };
  }, [view]);

  if (!view) return <p style={{ fontFamily: 'sans-serif', padding: 24 }}>No resume data.</p>;

  /*
   * Page setup
   *  - Side-panel layouts (sidebar / executive / elegant) print edge-to-edge: margin 0, and the
   *    first page is exactly one A4 sheet (296mm min-height keeps it from spilling a blank page).
   *  - Every other layout keeps its own padding on page 1, and gets a 14mm top/bottom margin so
   *    text on page 2+ never touches the paper edge.
   */
  const css = `
    @page { size: A4; margin: ${view.panel ? '0' : '14mm 0'}; }
    ${view.panel ? '' : '@page :first { margin-top: 0; }'}
    :root { --page-min: ${view.panel ? '296mm' : '0px'}; }
    html, body, #root { margin: 0; padding: 0; background: #fff !important; overflow: visible !important; height: auto !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1, h2, h3, h4 { break-after: avoid; }
    li, p { orphans: 3; widows: 3; }
    ${view.panel ? 'aside, main { -webkit-box-decoration-break: clone; box-decoration-break: clone; }' : ''}
  `;

  return (
    <>
      <style>{css}</style>
      <ResumePreview sections={view.sections} customization={view.customization} exportMode />
    </>
  );
}
