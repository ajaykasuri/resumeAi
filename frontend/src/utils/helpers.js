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
