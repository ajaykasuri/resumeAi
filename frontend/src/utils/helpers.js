/* ── Date / Time ─────────────────────────── */
export function timeAgo(dateStr) {
  const now = new Date(), then = new Date(dateStr);
  const diff = (now - then) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(date, format = 'short') {
  if (!date) return '';
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (format === 'long') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toISOString().split('T')[0];
}

/* ── String utils ────────────────────────── */
export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function truncate(str, len = 60) {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* ── Validation ──────────────────────────── */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

/* ── Resume utils ────────────────────────── */
export function getInitials(name) {
  if (!name) return 'NA';
  return name.split(' ').map(n => n[0]?.toUpperCase()).slice(0, 2).join('');
}

export function getSectionDisplayName(type, customTitle) {
  if (customTitle) return customTitle;
  const names = {
    personal_info: 'Personal Info', summary: 'Summary', objective: 'Objective',
    education: 'Education', experience: 'Experience', skills: 'Skills',
    projects: 'Projects', certifications: 'Certifications', achievements: 'Achievements',
    languages: 'Languages', interests: 'Interests', declaration: 'Declaration',
    publications: 'Publications', volunteer: 'Volunteer', awards: 'Awards',
    references: 'References', custom: 'Custom Section',
  };
  return names[type] || capitalize(type.replace(/_/g, ' '));
}

export function calculateATSScore(sections) {
  let score = 0;
  const personal = sections.find(s => s.section_type === 'personal_info')?.content || {};
  const summary = sections.find(s => s.section_type === 'summary')?.content || {};
  const experience = sections.find(s => s.section_type === 'experience')?.content || {};
  const skills = sections.find(s => s.section_type === 'skills')?.content || {};

  // Personal info (20 points)
  if (personal.name) score += 5;
  if (personal.email) score += 5;
  if (personal.phone) score += 5;
  if (personal.location) score += 5;

  // Summary (20 points)
  if (summary.text && summary.text.length > 50) score += 20;
  else if (summary.text) score += 10;

  // Experience (30 points)
  const expItems = experience.items || [];
  if (expItems.length >= 2) score += 30;
  else if (expItems.length === 1) score += 20;
  else score += 5;

  // Skills (20 points)
  const allSkills = (skills.categories || []).flatMap(c => c.skills || []);
  if (allSkills.length >= 8) score += 20;
  else if (allSkills.length >= 4) score += 14;
  else if (allSkills.length > 0) score += 8;

  // Contact completeness (10 points)
  if (personal.linkedin) score += 5;
  if (personal.github || personal.website) score += 5;

  return Math.min(100, score);
}

export function calculateResumeCompleteness(sections = []) {
  const content = (type) => sections.find(section => section.section_type === type)?.content || {};
  const personal = content('personal_info');
  const summary = content('summary');
  const experience = content('experience');
  const education = content('education');
  const skills = content('skills');
  const projects = content('projects');
  const certifications = content('certifications');
  const checks = [
    { label: 'Name and professional title', complete: Boolean(personal.name && personal.title), weight: 10 },
    { label: 'Email and at least one contact method', complete: Boolean(personal.email && (personal.phone || personal.linkedin || personal.website)), weight: 10 },
    { label: 'Professional summary', complete: (summary.text || '').trim().length >= 50, weight: 15 },
    {
      label: 'Work history with achievements',
      complete: (experience.items || []).some(item => (item.bullets || []).some(Boolean) || item.description),
      weight: 25,
    },
    {
      label: 'Skills',
      complete: (skills.categories || []).some(category => (category.skills || []).some(Boolean)) ||
        (skills.items || []).some(Boolean),
      weight: 15,
    },
    { label: 'Education', complete: (education.items || []).some(item => item.degree || item.institution), weight: 10 },
    {
      label: 'Projects or certifications',
      complete: (projects.items || []).some(item => item.name || item.description) ||
        (certifications.items || []).some(item => item.name),
      weight: 10,
    },
    { label: 'Professional link', complete: Boolean(personal.linkedin || personal.website || personal.github), weight: 5 },
  ];
  const score = checks.reduce((total, check) => total + (check.complete ? check.weight : 0), 0);
  return { score, checks };
}

const JOB_DESCRIPTION_STOP_WORDS = new Set(
  'a about above after again against all also am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up upon us using very was we were what when where which while who whom why will with within without would you your yours yourself yourselves role work team ability required preferred experience candidate responsible responsibilities including strong excellent plus senior junior knowledge familiar'.split(' ')
);

export function calculateJobDescriptionMatch(sections = [], jobDescription = '') {
  const normalizeTerm = term => {
    term = term.replace(/^[.-]+|[.-]+$/g, '');
    if (term.length > 5 && term.endsWith('ing')) return term.slice(0, -3);
    if (term.length > 4 && term.endsWith('ed')) return term.slice(0, -2);
    if (term.length > 4 && term.endsWith('s') && !term.endsWith('ss')) return term.slice(0, -1);
    return term;
  };
  const terms = [...new Set(
    (jobDescription.toLowerCase().match(/[a-z][a-z+#.-]{1,}/g) || [])
      .map(normalizeTerm)
      .filter(term => !JOB_DESCRIPTION_STOP_WORDS.has(term))
  )].slice(0, 40);
  const extractValues = value => {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(extractValues).join(' ');
    if (value && typeof value === 'object') return Object.values(value).map(extractValues).join(' ');
    return '';
  };
  const resumeWords = new Set(
    sections.map(section => extractValues(section.content || {}))
      .join(' ').toLowerCase().match(/[a-z][a-z+#.-]{1,}/g)?.map(normalizeTerm) || []
  );
  const matched = terms.filter(term => resumeWords.has(term));
  const missing = terms.filter(term => !resumeWords.has(term));
  return {
    score: terms.length ? Math.round((matched.length / terms.length) * 100) : 0,
    matched,
    missing,
    keywordCount: terms.length,
  };
}

/* ── Download helpers ────────────────────── */
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name) {
  return (name || 'resume').replace(/[^a-z0-9_\- ]/gi, '').replace(/\s+/g, '_').toLowerCase();
}

/* ── Color utils ─────────────────────────── */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16),
  } : null;
}

export function isLightColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}
