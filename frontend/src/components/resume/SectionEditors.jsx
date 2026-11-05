import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SectionEditors.css';

/* ── Personal Info ───────────────────────── */
export function PersonalInfoEditor({ content, onChange }) {
  const f = (k) => (e) => onChange({ ...content, [k]: e.target.value });
  return (
    <div className="se-grid-2">
      <div className="form-group se-full"><label className="form-label">Full Name</label>
        <input className="form-input" placeholder="John Doe" value={content.name || ''} onChange={f('name')} /></div>
      <div className="form-group se-full"><label className="form-label">Professional Title</label>
        <input className="form-input" placeholder="Senior Software Engineer" value={content.title || ''} onChange={f('title')} /></div>
      <div className="form-group"><label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="john@example.com" value={content.email || ''} onChange={f('email')} /></div>
      <div className="form-group"><label className="form-label">Phone</label>
        <input className="form-input" placeholder="+91 98765 43210" value={content.phone || ''} onChange={f('phone')} /></div>
      <div className="form-group"><label className="form-label">Location</label>
        <input className="form-input" placeholder="Bengaluru, India" value={content.location || ''} onChange={f('location')} /></div>
      <div className="form-group"><label className="form-label">Website</label>
        <input className="form-input" placeholder="https://johndoe.dev" value={content.website || ''} onChange={f('website')} /></div>
      <div className="form-group"><label className="form-label">LinkedIn</label>
        <input className="form-input" placeholder="linkedin.com/in/johndoe" value={content.linkedin || ''} onChange={f('linkedin')} /></div>
      <div className="form-group"><label className="form-label">GitHub</label>
        <input className="form-input" placeholder="github.com/johndoe" value={content.github || ''} onChange={f('github')} /></div>
    </div>
  );
}

/* ── Summary ─────────────────────────────── */
export function SummaryEditor({ content, onChange, resumeContext }) {
  const [generating, setGenerating] = useState(false);
  const handleAI = async () => {
    if (!resumeContext?.jobRole && !resumeContext?.name) { toast.error('Add your name/job role first'); return; }
    setGenerating(true);
    try {
      const { data } = await aiAPI.generateSummary({
        name: resumeContext.name, jobRole: resumeContext.jobRole,
        skills: resumeContext.skills, yearsOfExperience: resumeContext.yearsExp,
      });
      onChange({ ...content, text: data.data.summary });
      toast.success('Summary generated!');
    } catch { toast.error('AI generation failed'); }
    finally { setGenerating(false); }
  };
  return (
    <div className="form-group">
      <div className="se-label-row">
        <label className="form-label">Professional Summary</label>
        <button className="btn btn-ghost btn-sm se-ai-btn" onClick={handleAI} disabled={generating}>
          <Sparkles size={13} /> {generating ? 'Generating...' : 'AI Generate'}
        </button>
      </div>
      <textarea className="form-textarea" rows={5} placeholder="Write a compelling professional summary..."
        value={content.text || ''} onChange={e => onChange({ ...content, text: e.target.value })} />
      <div className="form-hint">{(content.text || '').length}/500 characters</div>
    </div>
  );
}

/* ── Experience ──────────────────────────── */
export function ExperienceEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, key, val) => {
    const next = items.map((it, i) => i === idx ? { ...it, [key]: val } : it);
    onChange({ ...content, items: next });
  };
  const addItem = () => onChange({ ...content, items: [...items, { jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '', bullets: [''] }] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });
  const addBullet = (idx) => { const it = { ...items[idx], bullets: [...(items[idx].bullets || []), ''] }; const next = items.map((x, i) => i === idx ? it : x); onChange({ ...content, items: next }); };
  const updateBullet = (idx, bi, val) => { const bullets = items[idx].bullets.map((b, j) => j === bi ? val : b); update(idx, 'bullets', bullets); };
  const removeBullet = (idx, bi) => { const bullets = items[idx].bullets.filter((_, j) => j !== bi); update(idx, 'bullets', bullets); };

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <CollapsibleItem key={idx} title={item.jobTitle || `Experience ${idx + 1}`} onRemove={() => removeItem(idx)}>
          <div className="se-grid-2">
            <div className="form-group"><label className="form-label">Job Title</label>
              <input className="form-input" placeholder="Software Engineer" value={item.jobTitle || ''} onChange={e => update(idx, 'jobTitle', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Company</label>
              <input className="form-input" placeholder="Google" value={item.company || ''} onChange={e => update(idx, 'company', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Location</label>
              <input className="form-input" placeholder="Bengaluru, India" value={item.location || ''} onChange={e => update(idx, 'location', e.target.value)} /></div>
            <div className="form-group"></div>
            <div className="form-group"><label className="form-label">Start Date</label>
              <input className="form-input" placeholder="Jan 2022" value={item.startDate || ''} onChange={e => update(idx, 'startDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">End Date</label>
              <input className="form-input" placeholder="Present" value={item.endDate || ''} onChange={e => update(idx, 'endDate', e.target.value)} /></div>
          </div>
          <div className="form-group se-full">
            <label className="form-label">Key Achievements / Responsibilities</label>
            {(item.bullets || ['']).map((b, bi) => (
              <div key={bi} className="se-bullet-row">
                <span className="se-bullet-dot">•</span>
                <input className="form-input" placeholder="Increased performance by 40% by..." value={b} onChange={e => updateBullet(idx, bi, e.target.value)} />
                {(item.bullets || []).length > 1 && (
                  <button className="btn btn-ghost btn-icon se-rm-btn" onClick={() => removeBullet(idx, bi)}><Trash2 size={12} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-ghost btn-sm se-add-sub" onClick={() => addBullet(idx)}><Plus size={13} /> Add Bullet</button>
          </div>
        </CollapsibleItem>
      ))}
      <AddItemButton onClick={addItem} label="Add Experience" />
    </div>
  );
}

/* ── Education ───────────────────────────── */
export function EducationEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, key, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? { ...it, [key]: val } : it) });
  const addItem = () => onChange({ ...content, items: [...items, { degree: '', institution: '', location: '', startYear: '', endYear: '', gpa: '', description: '' }] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <CollapsibleItem key={idx} title={item.degree || `Education ${idx + 1}`} onRemove={() => removeItem(idx)}>
          <div className="se-grid-2">
            <div className="form-group se-full"><label className="form-label">Degree / Course</label>
              <input className="form-input" placeholder="B.Tech Computer Science" value={item.degree || ''} onChange={e => update(idx, 'degree', e.target.value)} /></div>
            <div className="form-group se-full"><label className="form-label">Institution</label>
              <input className="form-input" placeholder="IIT Bombay" value={item.institution || ''} onChange={e => update(idx, 'institution', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Start Year</label>
              <input className="form-input" placeholder="2018" value={item.startYear || ''} onChange={e => update(idx, 'startYear', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">End Year</label>
              <input className="form-input" placeholder="2022" value={item.endYear || ''} onChange={e => update(idx, 'endYear', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">GPA / Grade</label>
              <input className="form-input" placeholder="8.5 / 10" value={item.gpa || ''} onChange={e => update(idx, 'gpa', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Location</label>
              <input className="form-input" placeholder="Mumbai, India" value={item.location || ''} onChange={e => update(idx, 'location', e.target.value)} /></div>
          </div>
        </CollapsibleItem>
      ))}
      <AddItemButton onClick={addItem} label="Add Education" />
    </div>
  );
}

/* ── Skills ──────────────────────────────── */
export function SkillsEditor({ content, onChange }) {
  const cats = content.categories || [{ name: 'Technical Skills', skills: [] }];
  const updateCat = (idx, field, val) => onChange({ ...content, categories: cats.map((c, i) => i === idx ? { ...c, [field]: val } : c) });
  const addSkill = (idx, skill) => { if (!skill.trim()) return; updateCat(idx, 'skills', [...(cats[idx].skills || []), skill.trim()]); };
  const removeSkill = (catIdx, skillIdx) => updateCat(catIdx, 'skills', cats[catIdx].skills.filter((_, i) => i !== skillIdx));
  const addCat = () => onChange({ ...content, categories: [...cats, { name: 'New Category', skills: [] }] });
  const removeCat = (idx) => onChange({ ...content, categories: cats.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {cats.map((cat, catIdx) => (
        <div key={catIdx} className="se-skill-cat-block card">
          <div className="se-skill-cat-header">
            <input className="form-input se-cat-input" value={cat.name} onChange={e => updateCat(catIdx, 'name', e.target.value)} />
            {cats.length > 1 && (
              <button className="btn btn-ghost btn-icon se-rm-btn" onClick={() => removeCat(catIdx)}><Trash2 size={14} /></button>
            )}
          </div>
          <div className="se-skill-tags">
            {(cat.skills || []).map((skill, si) => (
              <span key={si} className="se-skill-tag">
                {skill}
                <button onClick={() => removeSkill(catIdx, si)}>×</button>
              </span>
            ))}
          </div>
          <SkillInput onAdd={(s) => addSkill(catIdx, s)} />
        </div>
      ))}
      <button className="btn btn-ghost btn-sm se-add-cat" onClick={addCat}><Plus size={13} /> Add Skill Category</button>
    </div>
  );
}

function SkillInput({ onAdd }) {
  const [val, setVal] = useState('');
  const submit = () => { if (val.trim()) { onAdd(val.trim()); setVal(''); } };
  return (
    <div className="se-skill-input-row">
      <input className="form-input" placeholder="Type a skill and press Enter"
        value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
      <button className="btn btn-primary btn-sm" onClick={submit}><Plus size={14} /></button>
    </div>
  );
}

/* ── Projects ────────────────────────────── */
export function ProjectsEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, key, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? { ...it, [key]: val } : it) });
  const addItem = () => onChange({ ...content, items: [...items, { name: '', description: '', technologies: [], link: '', highlights: [] }] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <CollapsibleItem key={idx} title={item.name || `Project ${idx + 1}`} onRemove={() => removeItem(idx)}>
          <div className="se-grid-2">
            <div className="form-group se-full"><label className="form-label">Project Name</label>
              <input className="form-input" placeholder="E-Commerce Platform" value={item.name || ''} onChange={e => update(idx, 'name', e.target.value)} /></div>
            <div className="form-group se-full"><label className="form-label">Project URL</label>
              <input className="form-input" placeholder="https://github.com/..." value={item.link || ''} onChange={e => update(idx, 'link', e.target.value)} /></div>
            <div className="form-group se-full"><label className="form-label">Technologies (comma separated)</label>
              <input className="form-input" placeholder="React, Node.js, MongoDB"
                value={Array.isArray(item.technologies) ? item.technologies.join(', ') : item.technologies || ''}
                onChange={e => update(idx, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></div>
            <div className="form-group se-full"><label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Describe your project and its impact..."
                value={item.description || ''} onChange={e => update(idx, 'description', e.target.value)} /></div>
          </div>
        </CollapsibleItem>
      ))}
      <AddItemButton onClick={addItem} label="Add Project" />
    </div>
  );
}

/* ── Certifications ──────────────────────── */
export function CertificationsEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, key, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? { ...it, [key]: val } : it) });
  const addItem = () => onChange({ ...content, items: [...items, { name: '', issuer: '', date: '', expiryDate: '' }] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <CollapsibleItem key={idx} title={item.name || `Certification ${idx + 1}`} onRemove={() => removeItem(idx)}>
          <div className="se-grid-2">
            <div className="form-group se-full"><label className="form-label">Certification Name</label>
              <input className="form-input" placeholder="AWS Solutions Architect" value={item.name || ''} onChange={e => update(idx, 'name', e.target.value)} /></div>
            <div className="form-group se-full"><label className="form-label">Issuing Organization</label>
              <input className="form-input" placeholder="Amazon Web Services" value={item.issuer || ''} onChange={e => update(idx, 'issuer', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Issue Date</label>
              <input className="form-input" placeholder="Jan 2023" value={item.date || ''} onChange={e => update(idx, 'date', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Expiry Date</label>
              <input className="form-input" placeholder="Jan 2026 or N/A" value={item.expiryDate || ''} onChange={e => update(idx, 'expiryDate', e.target.value)} /></div>
          </div>
        </CollapsibleItem>
      ))}
      <AddItemButton onClick={addItem} label="Add Certification" />
    </div>
  );
}

/* ── Achievements ────────────────────────── */
export function AchievementsEditor({ content, onChange }) {
  const items = content.items || [''];
  const update = (idx, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? val : it) });
  const addItem = () => onChange({ ...content, items: [...items, ''] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <div key={idx} className="se-bullet-row">
          <span className="se-bullet-dot">🏆</span>
          <input className="form-input" placeholder="Won Hackathon 2023 at IIT Delhi..."
            value={typeof item === 'string' ? item : item.text || ''} onChange={e => update(idx, e.target.value)} />
          {items.length > 1 && <button className="btn btn-ghost btn-icon se-rm-btn" onClick={() => removeItem(idx)}><Trash2 size={12} /></button>}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm se-add-sub" onClick={addItem}><Plus size={13} /> Add Achievement</button>
    </div>
  );
}

/* ── Languages ───────────────────────────── */
export function LanguagesEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, key, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? (typeof it === 'string' ? { name: it, level: '' } : { ...it, [key]: val }) : it) });
  const addItem = () => onChange({ ...content, items: [...items, { name: '', level: '' }] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });
  const LEVELS = ['Native', 'Fluent', 'Professional', 'Conversational', 'Basic'];

  return (
    <div className="se-items">
      {items.map((item, idx) => {
        const it = typeof item === 'string' ? { name: item, level: '' } : item;
        return (
          <div key={idx} className="se-grid-2 se-lang-row">
            <div className="form-group"><label className="form-label">Language</label>
              <input className="form-input" placeholder="English" value={it.name || ''} onChange={e => update(idx, 'name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Proficiency</label>
              <select className="form-select" value={it.level || ''} onChange={e => update(idx, 'level', e.target.value)}>
                <option value="">Select level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select></div>
            <button className="btn btn-ghost btn-icon se-rm-btn se-lang-rm" onClick={() => removeItem(idx)}><Trash2 size={12} /></button>
          </div>
        );
      })}
      <AddItemButton onClick={addItem} label="Add Language" />
    </div>
  );
}

/* ── Interests ───────────────────────────── */
export function InterestsEditor({ content, onChange }) {
  const items = content.items || [];
  const addItem = (val) => { if (val.trim()) onChange({ ...content, items: [...items, val.trim()] }); };
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });
  return (
    <div>
      <div className="se-skill-tags" style={{ marginBottom: 12 }}>
        {items.map((item, idx) => (
          <span key={idx} className="se-skill-tag">
            {typeof item === 'string' ? item : item.name}
            <button onClick={() => removeItem(idx)}>×</button>
          </span>
        ))}
      </div>
      <SkillInput onAdd={addItem} />
    </div>
  );
}

/* ── Custom Section ──────────────────────── */
export function CustomSectionEditor({ content, onChange }) {
  const items = content.items || [];
  const update = (idx, val) => onChange({ ...content, items: items.map((it, i) => i === idx ? val : it) });
  const addItem = () => onChange({ ...content, items: [...items, ''] });
  const removeItem = (idx) => onChange({ ...content, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="se-items">
      {items.map((item, idx) => (
        <div key={idx} className="se-bullet-row">
          <span className="se-bullet-dot">•</span>
          <textarea className="form-textarea" rows={2} placeholder="Add content..."
            value={typeof item === 'string' ? item : item.text || ''}
            onChange={e => update(idx, e.target.value)} />
          {items.length > 1 && <button className="btn btn-ghost btn-icon se-rm-btn" onClick={() => removeItem(idx)}><Trash2 size={12} /></button>}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm se-add-sub" onClick={addItem}><Plus size={13} /> Add Item</button>
    </div>
  );
}

/* ── Shared UI Helpers ───────────────────── */
function CollapsibleItem({ title, children, onRemove }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="se-collapsible card">
      <div className="se-collapsible-header" onClick={() => setOpen(!open)}>
        <GripVertical size={14} className="se-grip" />
        <span className="se-item-label">{title}</span>
        <div className="se-header-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon se-rm-btn" onClick={onRemove}><Trash2 size={13} /></button>
          <button className="btn btn-ghost btn-icon">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        </div>
      </div>
      {open && <div className="se-collapsible-body">{children}</div>}
    </div>
  );
}

function AddItemButton({ onClick, label }) {
  return (
    <button className="btn btn-secondary btn-sm se-add-item" onClick={onClick}>
      <Plus size={14} /> {label}
    </button>
  );
}

/* ── Master Section Editor ───────────────── */
export function SectionEditor({ section, onChange, resumeContext }) {
  const c = section.content;
  const up = (content) => onChange(content);

  switch (section.section_type) {
    case 'personal_info': return <PersonalInfoEditor content={c} onChange={up} />;
    case 'summary': case 'objective': return <SummaryEditor content={c} onChange={up} resumeContext={resumeContext} />;
    case 'experience': return <ExperienceEditor content={c} onChange={up} />;
    case 'education': return <EducationEditor content={c} onChange={up} />;
    case 'skills': return <SkillsEditor content={c} onChange={up} />;
    case 'projects': return <ProjectsEditor content={c} onChange={up} />;
    case 'certifications': return <CertificationsEditor content={c} onChange={up} />;
    case 'achievements': case 'awards': return <AchievementsEditor content={c} onChange={up} />;
    case 'languages': return <LanguagesEditor content={c} onChange={up} />;
    case 'interests': return <InterestsEditor content={c} onChange={up} />;
    default: return <CustomSectionEditor content={c} onChange={up} />;
  }
}
