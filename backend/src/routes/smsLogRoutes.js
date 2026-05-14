const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSmsLogs } = require('../controllers/smsLogController');

router.route('/')
  .get(protect, getSmsLogs);

module.exports = router;
