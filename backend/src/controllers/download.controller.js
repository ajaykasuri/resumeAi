const { query, queryOne } = require('../config/database');
const { getResumeWithSections, canAccessResume, toPrintPayload } = require('../utils/resume-data');
const { renderResumePDF } = require('../utils/pdf-renderer');
const { buildResumeDocx } = require('../utils/docx-builder');

/** Load a resume and make sure the requester owns it (404 / 403 are sent here). */
async function loadOwnedResume(req, res) {
  const resume = await getResumeWithSections(req.params.id);
  if (!resume) {
    res.status(404).json({ success: false, message: 'Resume not found' });
    return null;
  }
  if (!canAccessResume(resume, req.user)) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return null;
  }
  return resume;
}

const resumeName = (resume) =>
  resume.sections.find((s) => s.section_type === 'personal_info')?.content?.name || resume.title || 'Resume';

/** ASCII-safe fallback + RFC 5987 UTF-8 filename so names like "José" download correctly. */
function sendFile(res, buffer, filename, contentType) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-store');
  res.end(buffer);
}

const safeFileBase = (name) => (String(name || 'resume').replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'resume');

const logDownload = (resume, req, format, size) => query(
  'INSERT INTO downloads (resume_id, user_id, format, ip_address, file_size_bytes) VALUES (?, ?, ?, ?, ?)',
  [resume.id, req.user?.role !== 'guest' ? req.user?.id : null, format, req.ip, size]
);

// POST /api/downloads/pdf/:id/track   (kept for backward compatibility; the server now logs PDFs itself)
const recordPDFDownload = async (req, res, next) => {
  try {
    const fileSizeBytes = Number(req.body.fileSizeBytes);
    if (!Number.isSafeInteger(fileSizeBytes) || fileSizeBytes <= 0) {
      return res.status(400).json({ success: false, message: 'A valid PDF file size is required' });
    }
    const resume = await queryOne(
      'SELECT id, user_id, guest_session_id FROM resumes WHERE uuid = ?',
      [req.params.id]
    );
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (!canAccessResume(resume, req.user)) return res.status(403).json({ success: false, message: 'Access denied' });

    await logDownload(resume, req, 'pdf', fileSizeBytes);
    await query('UPDATE resumes SET download_count = download_count + 1 WHERE id = ?', [resume.id]);
    res.json({ success: true, message: 'PDF download recorded' });
  } catch (error) {
    next(error);
  }
};

// GET /api/downloads/pdf/:id[?preview=1]
// Prints the real template (same React components as the builder) in headless Chromium.
const downloadPDF = async (req, res, next) => {
  try {
    const resume = await loadOwnedResume(req, res);
    if (!resume) return;
    const isPreview = req.query.preview === '1';

    let pdf;
    try {
      pdf = await renderResumePDF(toPrintPayload(resume));
    } catch (error) {
      console.error('PDF render failed:', error);
      return res.status(502).json({
        success: false,
        message: 'Could not generate the PDF right now. Please try again in a moment.',
      });
    }

    if (!isPreview) {
      await logDownload(resume, req, 'pdf', pdf.length);
      await query('UPDATE resumes SET download_count = download_count + 1 WHERE id = ?', [resume.id]);
    }
    sendFile(res, pdf, `${safeFileBase(resumeName(resume))}_resume.pdf`, 'application/pdf');
  } catch (error) { next(error); }
};

// GET /api/downloads/docx/:id
// Editable Word file generated natively (real Word paragraphs/tables, not an image).
const downloadDOCX = async (req, res, next) => {
  try {
    const resume = await loadOwnedResume(req, res);
    if (!resume) return;

    const docx = await buildResumeDocx(resume);
    await logDownload(resume, req, 'docx', docx.length);
    sendFile(
      res, docx, `${safeFileBase(resumeName(resume))}_resume.docx`,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  } catch (error) { next(error); }
};

module.exports = { downloadPDF, downloadDOCX, recordPDFDownload };
