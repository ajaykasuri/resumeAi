# How PDF and Word export work

```
Builder preview ─┐
                 ├─ <ResumePreview>  (the ONE place a template is designed)
/print page ─────┘          │
                            ▼
GET /api/downloads/pdf/:id  →  Chromium opens  <frontend>/print  with the resume JSON injected
                            →  page.pdf()  →  real vector PDF (selectable text, embedded fonts)

GET /api/downloads/docx/:id →  utils/docx-builder.js  →  native, editable Word file
```

## PDF = exact copy of the template
* Rendered by the same React components as the builder, then printed by headless Chromium.
* Real text (ATS-readable), sharp at any zoom, ~40–100 KB, real page breaks (entries never split).
* The server loads the resume from the DB and injects it into the page. Nothing is trusted from the
  browser, the page may only load from the frontend origin, and the endpoint checks ownership.
* Fonts are self-hosted (`frontend/src/fonts.js`, `@fontsource/*`), so preview and PDF always use the
  same font files — no Google Fonts / internet needed.

## Word = editable file that follows the template
Word is a different layout engine than HTML, so a .docx can never be byte-identical to the PDF — but it is
built to look like the same template and stays fully editable (real paragraphs, tables and bullets, not an image):
* **Same typeface** — the template's font is *embedded inside the .docx* (`utils/word-fonts.js`, files in
  `backend/assets/fonts`), so Word for Windows/Mac and LibreOffice show Inter / Syne / Playfair etc. exactly like the PDF.
  Viewers that ignore embedded fonts (Word online, Google Docs) use a mapped Office font instead of Times New Roman.
* **Same structure** — sidebar, banner, tinted panel, ledger, timeline and pill-chip skills are rebuilt natively per layout,
  using the same colours, defaults and slug→layout mapping as the web preview (`utils/resume-defaults.js`).
* Limits of Word itself: only Regular/Bold (no 300/500/600 weights), no gradients, circles become plain text initials.
  Use the PDF when you need the exact design.

## Deploying
* Backend needs Chromium. `npm install` downloads one. On Linux containers install its libraries, e.g.
  Debian/Ubuntu: `apt-get install -y libnss3 libatk-bridge2.0-0 libgbm1 libasound2 libxkbcommon0 libxdamage1 libxrandr2 libpango-1.0-0 libcairo2 fonts-liberation`
  (or use the `ghcr.io/puppeteer/puppeteer` base image).
* Set `PRINT_BASE_URL` to where the backend can reach the **built** frontend (it must serve `/print`
  with the SPA fallback — CRA dev server and any static host with `try_files /index.html` both do).
* Make sure `/print` is not blocked by a login wall or CSP on your reverse proxy.

## Adding / changing a template
1. Design it in `components/resume/ResumePreview.jsx` (add to `LAYOUTS` + `TEMPLATE_LAYOUTS`).
2. Mirror the slug in `backend/src/utils/resume-defaults.js → TEMPLATE_LAYOUTS` (Word export).
3. Add a Word layout in `utils/docx-builder.js` if it needs one (otherwise it falls back to `classic`).
4. New font? `@fontsource` package in `frontend/` + `fonts.js`, then `python backend/scripts/build-word-fonts.py` (Word embedding).
PDF needs no extra work — it renders whatever the preview renders.
Side-panel layouts go in `PANEL_LAYOUTS` (they print edge-to-edge on a single A4 sheet).

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| "Could not generate the PDF" (502) | Backend can't reach `PRINT_BASE_URL`/print, or Chromium libs missing. Check `PRINT_BASE_URL` and the server log line `PDF render failed:`. |
| PDF text in wrong font | Font not listed in `fonts.js` — add the `@fontsource` package + import. |
| Blank 2nd page | A layout min-height exceeds one sheet — use `var(--page-min, 1123px)` (see ResumePreview). |
