const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { generateResume, improveSection, calculateAtsScore, generateSummary } = require('../controllers/ai.controller');

const router = express.Router();
router.post('/generate', authenticate, generateResume);
router.post('/improve-section', authenticate, improveSection);
router.post('/ats-score', authenticate, calculateAtsScore);
router.post('/generate-summary', authenticate, generateSummary);

module.exports = router;
