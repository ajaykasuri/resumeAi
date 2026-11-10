const { v4: uuidv4 } = require('uuid');
const { pool, query, queryOne, transaction } = require('../config/database');

let versionsTableReady;
async function ensureResumeVersionsTable() {
  if (!versionsTableReady) {
    versionsTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS resume_versions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        resume_id INT UNSIGNED NOT NULL,
        version_name VARCHAR(120) NOT NULL,
        snapshot JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
        INDEX idx_resume_versions (resume_id, created_at)
      )
    `).catch(error => {
      versionsTableReady = null;
      throw error;
    });
  }
  await versionsTableReady;
}

async function getResumeForVersioning(uuid, user) {
  const resume = await queryOne('SELECT * FROM resumes WHERE uuid = ?', [uuid]);
  if (!resume) return { error: 'not-found' };
  if (user?.role === 'guest') {
    if (resume.guest_session_id !== user.sessionId) return { error: 'forbidden' };
  } else if (resume.user_id !== user?.id) {
    return { error: 'forbidden' };
  }
  return { resume };
}

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

// GET /api/resumes/:id/versions
const getResumeVersions = async (req, res, next) => {
  try {
    await ensureResumeVersionsTable();
    const result = await getResumeForVersioning(req.params.id, req.user);
    if (result.error === 'not-found') {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (result.error) return res.status(403).json({ success: false, message: 'Access denied' });

    const versions = await query(
      'SELECT id, version_name, created_at FROM resume_versions WHERE resume_id = ? ORDER BY created_at DESC LIMIT 50',
      [result.resume.id]
    );
    res.json({ success: true, data: { versions } });
  } catch (error) {
    next(error);
  }
};

// POST /api/resumes/:id/versions
const createResumeVersion = async (req, res, next) => {
  try {
    const versionName = typeof req.body.versionName === 'string' ? req.body.versionName.trim() : '';
    if (!versionName || versionName.length > 120) {
      return res.status(400).json({ success: false, message: 'Version name must be between 1 and 120 characters.' });
    }

    await ensureResumeVersionsTable();
    const result = await getResumeForVersioning(req.params.id, req.user);
    if (result.error === 'not-found') {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (result.error) return res.status(403).json({ success: false, message: 'Access denied' });

    const sections = await query(
      'SELECT section_type, custom_title, content, sort_order, is_visible FROM resume_sections WHERE resume_id = ? ORDER BY sort_order ASC',
      [result.resume.id]
    );
    const snapshot = {
      title: result.resume.title,
      template_id: result.resume.template_id,
      target_job_role: result.resume.target_job_role,
      customization: typeof result.resume.customization === 'string'
        ? JSON.parse(result.resume.customization)
        : result.resume.customization,
      sections: sections.map(section => ({
        ...section,
        content: typeof section.content === 'string' ? JSON.parse(section.content) : section.content,
      })),
    };
    const insert = await query(
      'INSERT INTO resume_versions (resume_id, version_name, snapshot) VALUES (?, ?, ?)',
      [result.resume.id, versionName, JSON.stringify(snapshot)]
    );
    res.status(201).json({
      success: true,
      data: { version: { id: insert.insertId, version_name: versionName } },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/resumes/:id/versions/:versionId/restore
const restoreResumeVersion = async (req, res, next) => {
  try {
    await ensureResumeVersionsTable();
    const result = await getResumeForVersioning(req.params.id, req.user);
    if (result.error === 'not-found') {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (result.error) return res.status(403).json({ success: false, message: 'Access denied' });

    const version = await queryOne(
      'SELECT snapshot FROM resume_versions WHERE id = ? AND resume_id = ?',
      [req.params.versionId, result.resume.id]
    );
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });
    const snapshot = typeof version.snapshot === 'string' ? JSON.parse(version.snapshot) : version.snapshot;
    if (!snapshot || !Array.isArray(snapshot.sections)) {
      return res.status(500).json({ success: false, message: 'Stored resume version is invalid.' });
    }

    await transaction(async conn => {
      await conn.execute('DELETE FROM resume_sections WHERE resume_id = ?', [result.resume.id]);
      for (let index = 0; index < snapshot.sections.length; index += 1) {
        const section = snapshot.sections[index];
        await conn.execute(
          `INSERT INTO resume_sections (resume_id, section_type, custom_title, content, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            result.resume.id,
            section.section_type,
            section.custom_title || null,
            JSON.stringify(section.content || {}),
            section.sort_order || index + 1,
            section.is_visible !== false && section.is_visible !== 0,
          ]
        );
      }
      await conn.execute(
        `UPDATE resumes SET title = ?, template_id = ?, target_job_role = ?, customization = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          snapshot.title || result.resume.title,
          snapshot.template_id ?? null,
          snapshot.target_job_role || null,
          JSON.stringify(snapshot.customization || {}),
          result.resume.id,
        ]
      );
    });
    res.json({ success: true, message: 'Resume version restored successfully' });
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
  getResumeVersions, createResumeVersion, restoreResumeVersion,
};
