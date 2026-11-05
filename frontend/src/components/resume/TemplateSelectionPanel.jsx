import React, { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, LayoutTemplate, X } from 'lucide-react';
import { templateAPI } from '../../services/api';
import ResumePreview from './ResumePreview';
import toast from 'react-hot-toast';
import './TemplateSelectionPanel.css';

export default function TemplateSelectionPanel({ sections, customization, onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    templateAPI.getAll()
      .then(({ data }) => {
        const available = data.data.templates || [];
        if (!active) return;
        setTemplates(available);
        const selectedIndex = available.findIndex(template => template.slug === customization.templateSlug);
        setActiveIndex(Math.max(0, selectedIndex));
      })
      .catch(() => {
        if (active) toast.error('Failed to load resume templates');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [customization.templateSlug]);

  const template = templates[activeIndex];
  const previewCustomization = template
    ? { ...customization, ...(template.config || {}), templateSlug: template.slug }
    : customization;

  const navigate = (direction) => {
    setActiveIndex(index => (index + direction + templates.length) % templates.length);
  };

  return (
    <aside className="template-carousel-panel" aria-label="Choose a resume template">
      <header className="template-carousel-header">
        <div className="template-carousel-heading">
          <LayoutTemplate size={18} />
          <div>
            <h2>Choose a template</h2>
            <p>Preview each design, then apply your choice.</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close template selection">
          <X size={16} />
        </button>
      </header>

      {loading ? (
        <div className="template-carousel-empty">Loading templates...</div>
      ) : template ? (
        <>
          <div className="template-carousel-preview">
            <ResumePreview
              sections={sections}
              customization={previewCustomization}
              templateSlug={template.slug}
            />
          </div>
          <div className="template-carousel-details">
            <div className="template-carousel-name">{template.name}</div>
            <div className="template-carousel-category">{template.category}</div>
          </div>
          <div className="template-carousel-controls">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} aria-label="Previous template">
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="template-carousel-count">{activeIndex + 1} / {templates.length}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(1)} aria-label="Next template">
              Next <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary template-carousel-apply"
            onClick={() => onSelect(template)}
          >
            <Check size={16} /> Use this template
          </button>
        </>
      ) : (
        <div className="template-carousel-empty">No templates are available.</div>
      )}
    </aside>
  );
}
