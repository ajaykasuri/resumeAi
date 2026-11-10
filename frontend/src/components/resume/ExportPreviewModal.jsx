import React, { useEffect, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import ResumePreview from './ResumePreview';
import { downloadAPI } from '../../services/api';
import { readBlobError } from '../../utils/downloadFile';
import './ExportPreviewModal.css';

/**
 * PDF tab  -> the real PDF produced by the server (same React template, printed by Chromium),
 *             so what you see here is byte-for-byte what gets downloaded.
 * Word tab -> editable .docx (native Word layout). Word is a different layout engine, so it is an
 *             editable approximation; the PDF is the pixel-exact version.
 */
export default function ExportPreviewModal({
  resumeId, title, sections, customization, onClose, onPrepare, onDownloadPDF, onDownloadDOCX,
}) {
  const [format, setFormat] = useState('pdf');
  const [pdf, setPdf] = useState({ url: '', blob: null });
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const downloadWord = async () => {
    if (resumeId && await onPrepare()) await onDownloadDOCX();
  };

  const downloadPDF = async () => {
    if (!resumeId || loadingPDF || !pdf.blob) return;
    await onDownloadPDF();
  };

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  // (Re)generate the PDF preview whenever the resume changes — debounced so typing doesn't spam the server.
  useEffect(() => {
    if (format !== 'pdf' || !resumeId) return undefined;
    let active = true;
    let objectUrl = '';
    setPdfError('');
    setLoadingPDF(true);

    const timer = window.setTimeout(async () => {
      try {
        if (!await onPrepare()) throw new Error('Save the resume before previewing the PDF.');
        const { data } = await downloadAPI.previewPDF(resumeId);
        const blob = new Blob([data], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        if (active) setPdf({ url: objectUrl, blob }); else URL.revokeObjectURL(objectUrl);
      } catch (error) {
        const message = await readBlobError(error, 'Could not create the PDF preview.');
        if (active) { setPdf({ url: '', blob: null }); setPdfError(message); }
      } finally {
        if (active) setLoadingPDF(false);
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [format, resumeId, onPrepare, sections, customization]);

  return (
    <div className="export-preview-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="export-preview-modal" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
        <header className="export-preview-header">
          <div>
            <h2 id="export-preview-title">Preview your export</h2>
            <p>{title || 'Resume'} · The PDF is an exact copy of your selected template.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </header>

        <div className="export-preview-toolbar">
          <div className="export-preview-tabs" role="tablist" aria-label="Export format">
            <button type="button" role="tab" aria-selected={format === 'pdf'} className={format === 'pdf' ? 'active' : ''} onClick={() => setFormat('pdf')}>
              PDF
            </button>
            <button type="button" role="tab" aria-selected={format === 'docx'} className={format === 'docx' ? 'active' : ''} onClick={() => setFormat('docx')}>
              Editable Word
            </button>
          </div>
          {format === 'pdf' ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={downloadPDF} disabled={!resumeId || loadingPDF || !pdf.blob}>
              <Download size={14} /> Download PDF
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={downloadWord} disabled={!resumeId}>
              <Download size={14} /> Download Word
            </button>
          )}
        </div>

        <div className={`export-preview-content ${format === 'docx' ? 'word-preview' : ''}`}>
          {format === 'pdf' && (
            !resumeId ? <div className="export-preview-message">Save your resume to preview the generated PDF.</div> :
              loadingPDF ? <div className="export-preview-message"><span className="spinner" /> Preparing PDF preview...</div> :
                pdfError ? <div className="export-preview-message error">{pdfError}</div> :
                  pdf.url ? <iframe title="Generated PDF preview" src={pdf.url} /> : null
          )}
          {format === 'docx' && (
            <>
              <div className="export-preview-note">
                <FileText size={14} />
                <span>
                  Word keeps every line editable, using a Word-native layout with the same template colours and
                  structure. Fonts are swapped for Word-safe equivalents. Use the PDF when you need the exact design.
                </span>
              </div>
              <div className="export-preview-document">
                <ResumePreview sections={sections} customization={customization} />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
