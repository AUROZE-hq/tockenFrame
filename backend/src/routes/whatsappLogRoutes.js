const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWhatsAppLogs } = require('../controllers/whatsappLogController');

router.route('/')
  .get(protect, getWhatsAppLogs);

module.exports = router;
