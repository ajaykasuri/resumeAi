const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { query, queryOne } = require('../config/database');

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'guest') return res.json({ success: true, data: { stats: {} } });
    const [resumeCount] = await query('SELECT COUNT(*) as cnt FROM resumes WHERE user_id = ?', [req.user.id]);
    const [downloadCount] = await query(
      'SELECT COALESCE(SUM(download_count),0) as cnt FROM resumes WHERE user_id = ?', [req.user.id]
    );
    const [viewCount] = await query(
      'SELECT COALESCE(SUM(view_count),0) as cnt FROM resumes WHERE user_id = ?', [req.user.id]
    );
    const recent = await query(
      `SELECT r.uuid, r.title, r.status, r.updated_at, r.download_count, r.view_count, r.ats_score,
        t.name as template_name FROM resumes r LEFT JOIN templates t ON r.template_id = t.id
        WHERE r.user_id = ? ORDER BY r.updated_at DESC LIMIT 5`,
      [req.user.id]
    );
    res.json({
      success: true,
      data: {
        stats: {
          totalResumes: resumeCount.cnt,
          totalDownloads: downloadCount.cnt,
          totalViews: viewCount.cnt,
        },
        recentResumes: recent,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
