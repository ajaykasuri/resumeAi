const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const {
  getResumes, getResume, createResume, updateResume,
  deleteResume, duplicateResume, updateSections, getSharedResume,
} = require('../controllers/resume.controller');

const router = express.Router();

router.get('/shared/:token', optionalAuth, getSharedResume);
router.get('/', authenticate, getResumes);
router.get('/:id', authenticate, getResume);
router.post('/', authenticate, createResume);
router.put('/:id', authenticate, updateResume);
router.delete('/:id', authenticate, deleteResume);
router.post('/:id/duplicate', authenticate, duplicateResume);
router.put('/:id/sections', authenticate, updateSections);

module.exports = router;
