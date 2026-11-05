// template.routes.js
const express = require('express');
const { getTemplates, getTemplate } = require('../controllers/template.controller');
const router = express.Router();
router.get('/', getTemplates);
router.get('/:slug', getTemplate);
module.exports = router;
