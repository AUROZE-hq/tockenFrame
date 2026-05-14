const express = require('express');
const router = express.Router();
const { loginAdmin, verifyAdminPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/verify-password', protect, verifyAdminPassword);

module.exports = router;
