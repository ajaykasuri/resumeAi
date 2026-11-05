import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, ArrowLeft, Eye, AlertCircle, Sparkles } from 'lucide-react';
import { resumeAPI, downloadAPI } from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';
import toast from 'react-hot-toast';
import './SharedResume.css';

export default function SharedResume() {
  const { token } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    resumeAPI.getShared(token)
      .then(({ data }) => setResume(data.data.resume))
      .catch(() => setError('Resume not found or is no longer public.'))
      .finally(() => setLoading(false));

    // Responsive scale
    const calc = () => setScale(Math.min(0.7, (window.innerWidth - 80) / 794));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!resume) return;
    setDownloading(true);
    try {
      const { data } = await downloadAPI.pdf(resume.uuid);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.title || 'resume'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Download failed — please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="shared-loading">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p>Loading resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-error">
        <div className="error-card card">
          <AlertCircle size={40} className="error-icon" />
          <h2>Resume Not Found</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={15} /> Go to ResumeAI
          </Link>
        </div>
      </div>
    );
  }

  const customization = resume.customization || {};
  const sections = resume.sections || [];

  return (
    <div className="shared-root">
      {/* Header Bar */}
      <header className="shared-header">
        <Link to="/" className="shared-logo">
          <div className="logo-icon"><FileText size={16} /></div>
          <span className="logo-text">Resume<span className="logo-accent">AI</span></span>
        </Link>

        <div className="shared-meta">
          <Eye size={14} />
          <span className="shared-title">{resume.title}</span>
          <span className="shared-views">{resume.view_count} views</span>
        </div>

        <div className="shared-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
            <Share2 size={14} /> Share
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} disabled={downloading}>
            <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link to="/register" className="btn btn-secondary btn-sm">
            <Sparkles size={14} /> Build Your Own
          </Link>
        </div>
      </header>

      {/* Resume Preview */}
      <main className="shared-main">
        <motion.div
          className="shared-preview-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="shared-preview-scaler"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: 794,
              marginLeft: `calc(50% - ${794 * scale / 2}px)`,
            }}
          >
            <ResumePreview sections={sections} customization={customization} />
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          className="shared-cta card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="shared-cta-inner">
            <div className="shared-cta-icon"><Sparkles size={22} /></div>
            <div className="shared-cta-text">
              <strong>Want a resume like this?</strong>
              <span>Build your own ATS-optimized resume with AI in minutes — free!</span>
            </div>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started Free <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
