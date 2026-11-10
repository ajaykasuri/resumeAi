import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate, Check, Crown, Sparkles,
  Eye, X, Zap, Star, Download, ChevronLeft, ChevronRight
} from 'lucide-react';
import { templateAPI, resumeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import ResumePreview from '../components/resume/ResumePreview';
import { buildCustomization } from '../Templateconfigs';   // ← NEW (src/templateConfigs.js)
import toast from 'react-hot-toast';
import './Templates.css';

const CATEGORIES = ['all', 'professional', 'modern', 'minimal', 'creative', 'executive'];

/* ─────────────────────────────────────────────
   RICH SAMPLE RESUME DATA — same for every template
───────────────────────────────────────────── */
const SAMPLE_SECTIONS = [
  {
    id: 'personal_info', section_type: 'personal_info', is_visible: true, sort_order: 1,
    content: {
      name: 'Aditya Kumar',
      title: 'Senior Full Stack Developer',
      email: 'aditya@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/adityakumar',
      github: 'github.com/adityakumar',
      website: 'adityakumar.dev',
    },
  },
  {
    id: 'summary', section_type: 'summary', is_visible: true, sort_order: 2,
    content: {
      text: 'Results-driven Full Stack Developer with 6+ years of experience building scalable web applications using React.js, Node.js, and cloud technologies. Proven track record of delivering high-performance solutions that drive business growth. Led cross-functional teams to ship products serving 500K+ users.',
    },
  },
  {
    id: 'experience', section_type: 'experience', is_visible: true, sort_order: 3,
    content: {
      items: [
        {
          jobTitle: 'Senior Software Engineer',
          company: 'Infosys Ltd.',
          location: 'Bengaluru',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Architected microservices platform serving 500K+ daily active users with 99.9% uptime',
            'Led team of 8 engineers to deliver React.js frontend 3 weeks ahead of schedule',
            'Reduced API response time by 65% through Redis caching and query optimization',
          ],
        },
        {
          jobTitle: 'Software Developer',
          company: 'Wipro Technologies',
          location: 'Hyderabad',
          startDate: 'Jun 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Built RESTful APIs using Node.js and Express serving 200K+ requests per day',
            'Implemented CI/CD pipelines with Jenkins reducing deployment time by 40%',
          ],
        },
      ],
    },
  },
  {
    id: 'education', section_type: 'education', is_visible: true, sort_order: 4,
    content: {
      items: [
        {
          degree: 'B.Tech — Computer Science & Engineering',
          institution: 'IIT Bombay',
          location: 'Mumbai',
          startYear: '2014',
          endYear: '2018',
          gpa: '8.7 / 10',
        },
      ],
    },
  },
  {
    id: 'skills', section_type: 'skills', is_visible: true, sort_order: 5,
    content: {
      categories: [
        { name: 'Frontend', skills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS'] },
        { name: 'Backend', skills: ['Node.js', 'Express', 'Python', 'GraphQL'] },
        { name: 'Cloud & DevOps', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'] },
        { name: 'Databases', skills: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'] },
      ],
    },
  },
  {
    id: 'projects', section_type: 'projects', is_visible: true, sort_order: 6,
    content: {
      items: [
        {
          name: 'E-Commerce Microservices Platform',
          description: 'Built a scalable e-commerce platform with 12 microservices handling 10K+ orders/day.',
          technologies: ['React', 'Node.js', 'Kafka', 'AWS', 'Docker'],
          link: 'github.com/adityakumar/ecommerce',
        },
        {
          name: 'Real-Time Analytics Dashboard',
          description: 'Developed a live analytics dashboard processing 1M+ events/hour with sub-second latency.',
          technologies: ['Next.js', 'Socket.io', 'ClickHouse', 'Redis'],
          link: 'github.com/adityakumar/analytics',
        },
      ],
    },
  },
  {
    id: 'certifications', section_type: 'certifications', is_visible: true, sort_order: 7,
    content: {
      items: [
        { name: 'AWS Solutions Architect — Professional', issuer: 'Amazon Web Services', date: 'Mar 2023' },
        { name: 'Google Cloud Professional Developer', issuer: 'Google Cloud', date: 'Aug 2022' },
      ],
    },
  },
];

/* ─────────────────────────────────────────────
   Scaled real resume preview inside a card
   `index` = position in the FULL (unfiltered) templates list,
   so a template keeps the same layout when you change category.
───────────────────────────────────────────── */
function TemplateThumb({ template, isSelected, onClick }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.315);

  // Scale the A4 page (794px) to exactly fill the card width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const customization = buildCustomization(template, { templateSlug: template.slug });

  return (
    <div
      ref={containerRef}
      className={`tpl-thumb-wrap ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="tpl-thumb-viewport">
        <div className="tpl-thumb-scaler" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ResumePreview
            sections={SAMPLE_SECTIONS}
            customization={customization}
            layout={customization.layout}
            templateSlug={template.slug}
          />
        </div>
      </div>

      <div className="tpl-thumb-overlay">
        {isSelected
          ? <div className="tpl-overlay-selected"><Check size={28} /></div>
          : <div className="tpl-overlay-hint"><Eye size={18} /> Preview</div>
        }
      </div>

      {template.is_premium && (
        <div className="tpl-premium-pill"><Crown size={9} /> Pro</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Full-screen lightbox preview
   `templates` = filtered list (for prev/next + counter)
───────────────────────────────────────────── */
function LightboxPreview({ template, templates, onClose, onUse, onNavigate }) {
  // Hooks first — no early return before them
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate]);

  const customization = buildCustomization(template, { templateSlug: template.slug });
  const layoutName = String(customization.layout || template.slug || 'classic');
  const idx = templates.findIndex(t => t.id === template.id);

  return (
    <motion.div
      className="lightbox-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button className="lightbox-nav left" onClick={e => { e.stopPropagation(); onNavigate(-1); }}>
        <ChevronLeft size={24} />
      </button>
      <button className="lightbox-nav right" onClick={e => { e.stopPropagation(); onNavigate(1); }}>
        <ChevronRight size={24} />
      </button>

      <motion.div
        className="lightbox-inner"
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar info panel */}
        <div className="lightbox-info">
          <div className="lightbox-header">
            <div>
              <h2 className="lightbox-name">{template.name}</h2>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize', marginTop: 6, display: 'inline-block' }}>
                {template.category}
              </span>
            </div>
            <button className="btn btn-ghost btn-icon lightbox-close" onClick={onClose}><X size={18} /></button>
          </div>

          <p className="lightbox-desc">{template.description}</p>

          <div className="lightbox-meta">
            <div className="lightbox-meta-row">
              <span className="lightbox-meta-label">Font</span>
              <span className="lightbox-meta-val">{customization.font}</span>
            </div>
            <div className="lightbox-meta-row">
              <span className="lightbox-meta-label">Layout</span>
              <span className="lightbox-meta-val" style={{ textTransform: 'capitalize' }}>
                {layoutName.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="lightbox-meta-row">
              <span className="lightbox-meta-label">ATS</span>
              <span className="lightbox-meta-val ats-ok">✓ Optimized</span>
            </div>
          </div>

          <div className="lightbox-colors">
            <div className="lightbox-meta-label" style={{ marginBottom: 8 }}>Color Palette</div>
            <div className="lightbox-swatch-row">
              <div className="lightbox-swatch" style={{ background: customization.primaryColor }} title="Primary" />
              <div className="lightbox-swatch" style={{ background: customization.accentColor }} title="Accent" />
              <div className="lightbox-swatch" style={{ background: '#ffffff', border: '1px solid #ddd' }} title="Background" />
            </div>
          </div>

          <div className="lightbox-features">
            {['ATS-Friendly Format', 'PDF & DOCX Export', 'AI Content Ready', 'Drag & Drop Sections'].map(f => (
              <div key={f} className="lightbox-feature"><Check size={13} />{f}</div>
            ))}
          </div>

          <div className="lightbox-actions">
            <button className="btn btn-primary btn-full btn-lg" onClick={() => onUse(template)}>
              <Zap size={16} /> Use This Template
            </button>
            {idx > 0 && (
              <button className="btn btn-ghost btn-full btn-sm" onClick={() => onNavigate(-1)}>
                ← Previous Template
              </button>
            )}
          </div>

          <div className="lightbox-counter">{idx + 1} / {templates.length}</div>
        </div>

        {/* Scrollable resume preview */}
        <div className="lightbox-preview-pane">
          <div className="lightbox-preview-scroll">
            <div className="lightbox-resume-wrap">
              <ResumePreview
                sections={SAMPLE_SECTIONS}
                customization={customization}
                layout={customization.layout}
                templateSlug={template.slug}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Templates() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected]     = useState(null);
  const [lightbox, setLightbox]     = useState(null);
  const [creating, setCreating]     = useState(false);

  useEffect(() => {
    templateAPI.getAll()
      .then(({ data }) => {
        const list = data.data.templates || [];
        setTemplates(list);
      })
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const handleUseTemplate = async (template) => {
    if (!isAuthenticated) { navigate('/register'); return; }
    setCreating(true);
    try {
      const { data } = await resumeAPI.create({
        title: `${template.name} Resume`,
        templateId: template.slug,
      });
      setLightbox(null);
      navigate(`/builder/${data.data.resumeId}`);
      toast.success(`${template.name} template applied!`);
    } catch {
      toast.error('Failed to create resume — try again');
    } finally {
      setCreating(false);
    }
  };

  const navigateLightbox = (dir) => {
    const idx = filtered.findIndex(t => t.id === lightbox.id);
    const next = filtered[(idx + dir + filtered.length) % filtered.length];
    if (next) setLightbox(next);
  };

  return (
    <div className="templates-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="templates-hero">
        <div className="hero-bg-orb orb-a" />
        <div className="hero-bg-orb orb-b" />
        <motion.div
          className="templates-hero-content"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-eyebrow"><LayoutTemplate size={13} /> Template Gallery</span>
          <h1>Resume Templates That<br /><span className="text-gradient">Actually Get Hired</span></h1>
          <p>Every template renders real resume content — what you see is exactly what you get. ATS-optimized, professionally crafted, ready for AI content.</p>
          <div className="hero-stats">
            <div className="hero-stat-item"><Star size={14} /><span><b>8+</b> Templates</span></div>
            <div className="hero-stat-item"><Check size={14} /><span><b>100%</b> ATS Friendly</span></div>
            <div className="hero-stat-item"><Download size={14} /><span><b>PDF & DOCX</b> Export</span></div>
          </div>
        </motion.div>
      </section>

      <div className="templates-container">

        {/* ── Category Filter ── */}
        <div className="filter-bar">
          <div className="category-filter">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'All Templates' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                {cat !== 'all' && (
                  <span className="cat-count">
                    {templates.filter(t => t.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="filter-hint">
            <Eye size={13} /> Click any card to preview full resume
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="tpl-page-grid">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="tpl-skeleton-card">
                <div className="skeleton tpl-skeleton-thumb" />
                <div className="tpl-skeleton-info">
                  <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 32, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div className="tpl-page-grid" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((tpl, i) => (
                <motion.div
                  key={tpl.id}
                  layout
                  className={`tpl-card ${selected?.id === tpl.id ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <TemplateThumb
                    template={tpl}
                    isSelected={selected?.id === tpl.id}
                    onClick={() => { setSelected(tpl); setLightbox(tpl); }}
                  />

                  <div className="tpl-card-footer">
                    <div className="tpl-card-meta">
                      <div className="tpl-card-name-row">
                        <h4 className="tpl-name">{tpl.name}</h4>
                        {tpl.is_premium && (
                          <span className="tpl-pro-badge"><Crown size={10} /> Pro</span>
                        )}
                      </div>
                      <span className="tpl-category-pill">{tpl.category}</span>
                    </div>
                    <div className="tpl-card-actions">
                      <button
                        className="btn btn-secondary btn-sm tpl-preview-btn"
                        onClick={(e) => { e.stopPropagation(); setSelected(tpl); setLightbox(tpl); }}
                      >
                        <Eye size={13} /> Preview
                      </button>
                      <button
                        className="btn btn-primary btn-sm tpl-use-btn"
                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(tpl); }}
                        disabled={creating}
                      >
                        {creating ? '...' : <><Zap size={13} /> Use</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── CTA Banner ── */}
        <motion.div
          className="templates-cta"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <div className="cta-glow" />
          <div className="cta-content">
            <div className="cta-icon-wrap"><Sparkles size={24} /></div>
            <div className="cta-text">
              <h3>Can't decide? Let AI pick the best template</h3>
              <p>Describe your role and skills — our AI writes the content and selects the ideal template automatically.</p>
            </div>
            <Link to="/ai-generator" className="btn btn-primary btn-lg cta-action-btn">
              <Sparkles size={16} /> Try AI Generator
            </Link>
          </div>
        </motion.div>

      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <LightboxPreview
            template={lightbox}
            templates={filtered}
            onClose={() => { setLightbox(null); setSelected(null); }}
            onUse={handleUseTemplate}
            onNavigate={navigateLightbox}
          />
        )}
      </AnimatePresence>
    </div>
  );
}