const { query, queryOne } = require('../config/database');

// GET /api/templates
const getTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM templates WHERE is_active = 1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    const templates = await query(sql, params);
    const parsed = templates.map(t => ({
      ...t,
      config: typeof t.config === 'string' ? JSON.parse(t.config) : t.config,
    }));
    res.json({ success: true, data: { templates: parsed } });
  } catch (error) { next(error); }
};

// GET /api/templates/:slug
const getTemplate = async (req, res, next) => {
  try {
    const tpl = await queryOne('SELECT * FROM templates WHERE slug = ? AND is_active = 1', [req.params.slug]);
    if (!tpl) return res.status(404).json({ success: false, message: 'Template not found' });
    tpl.config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config;
    res.json({ success: true, data: { template: tpl } });
  } catch (error) { next(error); }
};

module.exports = { getTemplates, getTemplate };
