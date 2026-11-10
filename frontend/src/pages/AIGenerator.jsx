import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Brain, Zap,
  ChevronDown, RefreshCw, Edit, Download, Star, Eye
} from 'lucide-react';
import { aiAPI, resumeAPI } from '../services/api';
import { useResume } from '../context/ResumeContext';
import ResumePreview from '../components/resume/ResumePreview';
import toast from 'react-hot-toast';
import './AIGenerator.css';

const EXP_LEVELS = [
  { value: 'fresher', label: 'Fresher', desc: '0–1 year' },
  { value: 'junior', label: 'Junior', desc: '1–3 years' },
  { value: 'mid', label: 'Mid-Level', desc: '3–6 years' },
  { value: 'senior', label: 'Senior', desc: '6–10 years' },
  { value: 'lead', label: 'Lead/Manager', desc: '10+ years' },
  { value: 'executive', label: 'Executive', desc: 'C-Suite / VP' },
];

const POPULAR_ROLES = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'DevOps Engineer', 'Marketing Manager', 'Data Analyst', 'Full Stack Developer',
  'Machine Learning Engineer', 'Business Analyst', 'Cloud Architect', 'Cybersecurity Analyst',
];

const STEPS = ['Input', 'Generate', 'Review', 'Export'];

export default function AIGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const { customization, applyAIContent, saveResume, setResumeId } = useResume();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', jobRole: '', skills: '', experienceLevel: 'mid',
    education: '', additionalContext: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [wasCached, setWasCached] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [previewSections, setPreviewSections] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (resumeId) setResumeId(resumeId);
  }, [resumeId]);

  const handleGenerate = async () => {
    if (!form.jobRole.trim()) { toast.error('Please enter a target job role'); return; }
    if (!form.skills.trim()) { toast.error('Please enter your skills'); return; }

    setGenerating(true);
    setStep(1);
    try {
      const { data } = await aiAPI.generate({ ...form, resumeId });
      const content = data.data.content;
      setGeneratedContent(content);
      setWasCached(data.data.cached);
      setGenerationTime(data.data.generationTime);

      // Build preview sections with AI content
      const personalSection = {
        id: 'personal_info', section_type: 'personal_info', is_visible: true, sort_order: 1,
        content: { name: form.name || 'Your Name', title: form.jobRole, email: '', phone: '', location: '' },
      };
      const summarySection = {
        id: 'summary', section_type: 'summary', is_visible: true, sort_order: 2,
        content: { text: content.summary || '' },
      };
      const skillsSection = {
        id: 'skills', section_type: 'skills', is_visible: true, sort_order: 5,
        content: content.skills || { categories: [{ name: 'Skills', skills: [] }] },
      };
      const expSection = {
        id: 'experience', section_type: 'experience', is_visible: true, sort_order: 3,
        content: { items: content.experience || [] },
      };
      const projSection = {
        id: 'projects', section_type: 'projects', is_visible: (content.projects?.length > 0), sort_order: 6,
        content: { items: content.projects || [] },
      };
      const certSection = {
        id: 'certifications', section_type: 'certifications', is_visible: (content.certifications?.length > 0), sort_order: 7,
        content: { items: content.certifications || [] },
      };

      setPreviewSections([personalSection, summarySection, expSection, skillsSection, projSection, certSection]);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed. Check your API key.');
      setStep(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyAndEdit = async () => {
    if (!generatedContent || applying) return;
    setApplying(true);
    try {
      const generatedSections = applyAIContent(generatedContent, {
        name: form.name.trim(),
        title: form.jobRole.trim(),
      });

      if (resumeId) {
        const saved = await saveResume({ targetJobRole: form.jobRole }, generatedSections);
        if (!saved) return;
        navigate(`/builder/${resumeId}`);
      } else {
        const title = `${form.name.trim() || form.jobRole.trim()} Resume`;
        const { data } = await resumeAPI.create({
          title,
          targetJobRole: form.jobRole,
          customization,
        });
        const createdResumeId = data.data.resumeId;
        await resumeAPI.updateSections(createdResumeId, generatedSections);
        navigate(`/builder/${createdResumeId}`);
      }

      toast.success('AI content applied to resume!');
    } catch (error) {
      console.error('Failed to apply AI-generated resume:', error);
      toast.error(error.response?.data?.message || 'Failed to apply AI content. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleRegenerate = () => {
    setStep(0);
    setGeneratedContent(null);
  };

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="aigen-root">
      {/* Header */}
      <div className="aigen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="aigen-title">
          <Sparkles size={20} className="aigen-title-icon" />
          <h2>AI Resume Generator</h2>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Progress */}
      <div className="aigen-progress">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`progress-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="progress-dot">{i < step ? <Check size={12} /> : <span>{i + 1}</span>}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`progress-line ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Body */}
      <div className="aigen-body">
        <AnimatePresence mode="wait">
          {/* Step 0: Input Form */}
          {step === 0 && (
            <motion.div key="input" className="aigen-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="aigen-form-card card">
                <h3 className="aigen-panel-title"><Brain size={18} /> Tell us about yourself</h3>
                <p className="aigen-panel-sub">The more details you provide, the better your AI-generated resume will be.</p>

                <div className="aigen-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" placeholder="Aditya Kumar" value={form.name} onChange={e => setField('name', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Job Role *</label>
                    <input className="form-input" placeholder="e.g. Full Stack Developer" value={form.jobRole} onChange={e => setField('jobRole', e.target.value)} />
                    <div className="role-suggestions">
                      {POPULAR_ROLES.map(r => (
                        <button key={r} className={`role-chip ${form.jobRole === r ? 'active' : ''}`} onClick={() => setField('jobRole', r)}>{r}</button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience Level *</label>
                    <div className="exp-levels">
                      {EXP_LEVELS.map(l => (
                        <button key={l.value} className={`exp-level-btn ${form.experienceLevel === l.value ? 'active' : ''}`}
                          onClick={() => setField('experienceLevel', l.value)}>
                          <span className="el-label">{l.label}</span>
                          <span className="el-desc">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Skills *</label>
                    <textarea className="form-textarea" rows={4}
                      placeholder="React.js, Node.js, TypeScript, AWS, MongoDB, Docker, REST APIs, Git..."
                      value={form.skills} onChange={e => setField('skills', e.target.value)} />
                    <div className="form-hint">Separate skills with commas. Include technical and soft skills.</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Education (Optional)</label>
                    <input className="form-input" placeholder="B.Tech Computer Science, IIT Bombay, 2022"
                      value={form.education} onChange={e => setField('education', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Context (Optional)</label>
                    <textarea className="form-textarea" rows={3}
                      placeholder="Any specific achievements, industries, company preferences, or goals..."
                      value={form.additionalContext} onChange={e => setField('additionalContext', e.target.value)} />
                  </div>
                </div>

                <button className="btn btn-primary btn-lg btn-full aigen-generate-btn"
                  onClick={handleGenerate} disabled={!form.jobRole || !form.skills}>
                  <Sparkles size={18} /> Generate My Resume with AI <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Generating */}
          {step === 1 && (
            <motion.div key="generating" className="aigen-panel aigen-generating"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="generating-card card">
                <div className="gen-animation">
                  <div className="gen-ring" /><div className="gen-ring r2" /><div className="gen-ring r3" />
                  <Sparkles size={32} className="gen-icon" />
                </div>
                <h3>Crafting your resume...</h3>
                <p>Our AI is analyzing your profile and generating ATS-optimized content</p>
                <div className="gen-steps">
                  {['Analyzing job requirements', 'Generating professional summary', 'Creating experience bullets', 'Optimizing ATS keywords', 'Finalizing resume content'].map((s, i) => (
                    <motion.div key={s} className="gen-step"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}>
                      <motion.div className="gen-step-dot" animate={{ scale: [1, 1.3, 1] }} transition={{ delay: i * 0.6, duration: 0.4 }} />
                      <span>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {step === 2 && generatedContent && (
            <motion.div key="review" className="aigen-panel aigen-review"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="review-layout">
                {/* Left: AI Content Summary */}
                <div className="review-left">
                  <div className="card review-header-card">
                    <div className="review-status">
                      <div className="review-status-icon"><Check size={16} /></div>
                      <div>
                        <div className="review-status-title">Resume Generated Successfully!</div>
                        <div className="review-status-sub">
                          {wasCached ? '⚡ Served from cache' : '🤖 Freshly generated'} · {generationTime}ms
                        </div>
                      </div>
                    </div>
                    {generatedContent.atsKeywords?.length > 0 && (
                      <div className="ats-keywords">
                        <div className="form-label" style={{ marginBottom: 8 }}>ATS Keywords Included</div>
                        <div className="kw-list">
                          {generatedContent.atsKeywords.slice(0, 12).map(kw => (
                            <span key={kw} className="kw-chip">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {generatedContent.improvementTips?.length > 0 && (
                      <div className="improvement-tips">
                        <div className="form-label" style={{ marginBottom: 8 }}>💡 AI Suggestions</div>
                        {generatedContent.improvementTips.map((tip, i) => (
                          <div key={i} className="tip-item"><Star size={11} /><span>{tip}</span></div>
                        ))}
                      </div>
                    )}
                    <div className="review-actions">
                      <button className="btn btn-primary btn-full" onClick={handleApplyAndEdit} disabled={applying}>
                        <Edit size={15} /> {applying ? 'Applying...' : 'Apply & Open Editor'}
                      </button>
                      <button className="btn btn-secondary btn-full" onClick={handleRegenerate}>
                        <RefreshCw size={14} /> Regenerate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="review-right">
                  <div className="preview-label-bar">
                    <Eye size={13} /> Resume Preview
                  </div>
                  <div className="review-preview-wrap">
                    <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: 794 }}>
                      <ResumePreview sections={previewSections} customization={customization} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
