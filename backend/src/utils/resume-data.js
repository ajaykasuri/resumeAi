const { query, queryOne } = require('../config/database');
const { DEFAULT_CUSTOMIZATION, resolveCustomization } = require('./resume-defaults');

/** Load a resume + its visible sections (content/customization already JSON-parsed). */
async function getResumeWithSections(uuid) {
  const resume = await queryOne(
    `SELECT r.*, t.name AS template_name, t.slug AS template_slug, t.config AS template_config
     FROM resumes r LEFT JOIN templates t ON r.template_id = t.id WHERE r.uuid = ?`,
    [uuid]
  );
  if (!resume) return null;

  const sections = await query(
    'SELECT * FROM resume_sections WHERE resume_id = ? AND is_visible = 1 ORDER BY sort_order ASC',
    [resume.id]
  );
  resume.sections = sections.map((s) => ({
    ...s,
    content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
  }));
  if (typeof resume.customization === 'string') resume.customization = JSON.parse(resume.customization);
  if (typeof resume.template_config === 'string') resume.template_config = JSON.parse(resume.template_config);
  return resume;
}

/** Same ownership rule used by resume.controller (owner or the guest session that created it). */
function canAccessResume(resume, user) {
  if (!resume || !user) return false;
  return user.role === 'guest'
    ? resume.guest_session_id === user.sessionId
    : resume.user_id === user.id;
}

/** The only data the headless print page receives (injected before the page loads). */
function toPrintPayload(resume) {
  return {
    title: resume.title || 'Resume',
    customization: resolveCustomization(resume),
    sections: resume.sections.map((s) => ({
      id: s.id,
      section_type: s.section_type,
      custom_title: s.custom_title || null,
      sort_order: s.sort_order,
      is_visible: s.is_visible !== 0 && s.is_visible !== false,
      content: s.content,
    })),
  };
}

module.exports = {
  getResumeWithSections, canAccessResume, resolveCustomization, toPrintPayload, DEFAULT_CUSTOMIZATION,
};
