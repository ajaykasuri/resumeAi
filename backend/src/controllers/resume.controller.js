const { v4: uuidv4 } = require('uuid');
const { query, queryOne, transaction } = require('../config/database');

// GET /api/resumes
const getResumes = async (req, res, next) => {
  try {
    let resumes;
    if (req.user.role === 'guest') {
      resumes = await query(
        `SELECT r.*, t.name as template_name, t.slug as template_slug
         FROM resumes r LEFT JOIN templates t ON r.template_id = t.id
         WHERE r.guest_session_id = ? ORDER BY r.updated_at DESC`,
        [req.user.sessionId]
      );
    } else {
      resumes = await query(
        `SELECT r.*, t.name as template_name, t.slug as template_slug
         FROM resumes r LEFT JOIN templates t ON r.template_id = t.id
         WHERE r.user_id = ? ORDER BY r.updated_at DESC`,
        [req.user.id]
      );
    }
    res.json({ success: true, data: { resumes } });
  } catch (error) {
    next(error);
  }
};

// GET /api/resumes/:id
const getResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await queryOne(
      `SELECT r.*, t.name as template_name, t.slug as template_slug, t.config as template_config
       FROM resumes r LEFT JOIN templates t ON r.template_id = t.id
       WHERE r.uuid = ?`,
      [id]
    );

    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Authorization check
    if (!resume.is_public) {
      if (req.user?.role === 'guest' && resume.guest_session_id !== req.user.sessionId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user?.role !== 'guest' && resume.user_id !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const sections = await query(
      'SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY sort_order ASC',
      [resume.id]
    );

    // Parse JSON content for each section
    const parsedSections = sections.map(s => ({
      ...s,
      content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
    }));

    if (resume.customization && typeof resume.customization === 'string') {
      resume.customization = JSON.parse(resume.customization);
    }
    if (resume.template_config && typeof resume.template_config === 'string') {
      resume.template_config = JSON.parse(resume.template_config);
    }

    // Track view
    await query(
      'INSERT INTO resume_analytics (resume_id, event_type, ip_address) VALUES (?, "view", ?)',
      [resume.id, req.ip]
    );

    res.json({ success: true, data: { resume: { ...resume, sections: parsedSections } } });
  } catch (error) {
    next(error);
  }
};

// POST /api/resumes
const createResume = async (req, res, next) => {
  try {
    const {
      title = 'Untitled Resume',
      templateId,
      targetJobRole,
      customization = {},
    } = req.body;

    const shareToken = uuidv4().replace(/-/g, '').substring(0, 16);

    let resumeId;
    await transaction(async (conn) => {
      // Get template id from uuid/slug
      let templateDbId = null;
      if (templateId) {
        const tpl = await queryOne('SELECT id FROM templates WHERE uuid = ? OR slug = ?', [templateId, templateId]);
        templateDbId = tpl?.id || null;
      }

      const userId = req.user.role !== 'guest' ? req.user.id : null;
      const guestSessionId = req.user.role === 'guest' ? req.user.sessionId : null;

      const [result] = await conn.execute(
        `INSERT INTO resumes (uuid, user_id, guest_session_id, template_id, title, target_job_role, 
          customization, share_token) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [userId, guestSessionId, templateDbId, title, targetJobRole || null,
          JSON.stringify(customization), shareToken]
      );

      resumeId = result.insertId;

      // Insert default sections
      const defaultSections = [
        { type: 'personal_info', content: { name: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '' }, order: 1 },
        { type: 'summary', content: { text: '' }, order: 2 },
        { type: 'experience', content: { items: [] }, order: 3 },
        { type: 'education', content: { items: [] }, order: 4 },
        { type: 'skills', content: { categories: [{ name: 'Technical Skills', skills: [] }] }, order: 5 },
        { type: 'projects', content: { items: [] }, order: 6 },
        { type: 'certifications', content: { items: [] }, order: 7 },
        { type: 'achievements', content: { items: [] }, order: 8 },
        { type: 'languages', content: { items: [] }, order: 9 },
      ];

      for (const section of defaultSections) {
        await conn.execute(
          'INSERT INTO resume_sections (resume_id, section_type, content, sort_order) VALUES (?, ?, ?, ?)',
          [resumeId, section.type, JSON.stringify(section.content), section.order]
        );
      }
    });

    const created = await queryOne('SELECT uuid FROM resumes WHERE id = ?', [resumeId]);
    res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      data: { resumeId: created.uuid },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/resumes/:id
const updateResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await queryOne('SELECT * FROM resumes WHERE uuid = ?', [id]);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    if (req.user.role !== 'guest' && resume.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, status, isPublic, customization, targetJobRole } = req.body;
    const templateId = req.body.templateId || customization?.templateSlug;

    let templateDbId = resume.template_id;
    if (templateId) {
      const tpl = await queryOne('SELECT id FROM templates WHERE uuid = ? OR slug = ?', [templateId, templateId]);
      templateDbId = tpl?.id || resume.template_id;
    }

    const normalizedTitle = typeof title === 'string' && title.trim() ? title.trim() : null;
    await query(
      `UPDATE resumes SET 
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        is_public = COALESCE(?, is_public),
        customization = COALESCE(?, customization),
        target_job_role = COALESCE(?, target_job_role),
        template_id = ?
       WHERE uuid = ?`,
      [normalizedTitle, status ?? null, isPublic ?? null,
        customization ? JSON.stringify(customization) : null,
        targetJobRole ?? null, templateDbId, id]
    );

    res.json({ success: true, message: 'Resume updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/resumes/:id
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await queryOne('SELECT * FROM resumes WHERE uuid = ?', [id]);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    if (req.user.role !== 'guest' && resume.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await query('DELETE FROM resumes WHERE uuid = ?', [id]);
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/resumes/:id/duplicate
const duplicateResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await queryOne('SELECT * FROM resumes WHERE uuid = ?', [id]);
    if (!original || (req.user.role !== 'guest' && original.user_id !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    let newResumeId;
    await transaction(async (conn) => {
      const shareToken = uuidv4().replace(/-/g, '').substring(0, 16);
      const [result] = await conn.execute(
        `INSERT INTO resumes (uuid, user_id, guest_session_id, template_id, title, target_job_role,
          customization, share_token) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [original.user_id, original.guest_session_id, original.template_id,
          `${original.title} (Copy)`, original.target_job_role, original.customization, shareToken]
      );
      newResumeId = result.insertId;

      const sections = await query(
        'SELECT * FROM resume_sections WHERE resume_id = ?', [original.id]
      );
      for (const section of sections) {
        await conn.execute(
          'INSERT INTO resume_sections (resume_id, section_type, custom_title, content, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)',
          [newResumeId, section.section_type, section.custom_title,
            section.content, section.sort_order, section.is_visible]
        );
      }
    });

    const created = await queryOne('SELECT uuid FROM resumes WHERE id = ?', [newResumeId]);
    res.status(201).json({ success: true, data: { resumeId: created.uuid } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/resumes/:id/sections
const updateSections = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;
    const resume = await queryOne('SELECT id, user_id from resumes WHERE uuid = ?', [id]);

    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (req.user.role !== 'guest' && resume.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await transaction(async (conn) => {
      // Delete existing sections
      await conn.execute('DELETE FROM resume_sections WHERE resume_id = ?', [resume.id]);
      // Re-insert updated sections
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        await conn.execute(
          `INSERT INTO resume_sections (resume_id, section_type, custom_title, content, sort_order, is_visible) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [resume.id, s.section_type || s.type, s.custom_title || null,
            JSON.stringify(s.content), i + 1, s.is_visible !== false]
        );
      }
      // Update resume updated_at
      await conn.execute('UPDATE resumes SET updated_at = NOW() WHERE id = ?', [resume.id]);
    });

    res.json({ success: true, message: 'Sections saved successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/resumes/shared/:token
const getSharedResume = async (req, res, next) => {
  try {
    const { token } = req.params;
    const resume = await queryOne(
      `SELECT r.*, t.name as template_name, t.slug as template_slug, t.config as template_config
       FROM resumes r LEFT JOIN templates t ON r.template_id = t.id
       WHERE r.share_token = ? AND r.is_public = 1`,
      [token]
    );

    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found or not public' });

    const sections = await query(
      'SELECT * FROM resume_sections WHERE resume_id = ? AND is_visible = 1 ORDER BY sort_order ASC',
      [resume.id]
    );

    const parsedSections = sections.map(s => ({
      ...s,
      content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
    }));

    await query('UPDATE resumes SET view_count = view_count + 1 WHERE id = ?', [resume.id]);

    res.json({ success: true, data: { resume: { ...resume, sections: parsedSections } } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumes, getResume, createResume, updateResume, deleteResume,
  duplicateResume, updateSections, getSharedResume,
};
