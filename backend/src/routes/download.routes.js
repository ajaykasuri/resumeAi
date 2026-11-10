const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { downloadPDF, downloadDOCX, recordPDFDownload } = require('../controllers/download.controller');

const router = express.Router();
router.post('/pdf/:id/track', authenticate, recordPDFDownload);
router.get('/pdf/:id', authenticate, downloadPDF);
router.get('/docx/:id', authenticate, downloadDOCX);

module.exports = router;
