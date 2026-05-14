const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    const admin = await Admin.findOne({ username });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(admin._id),
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify admin password
// @route   POST /api/auth/verify-password
// @access  Private (Admin only)
const verifyAdminPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Please provide password');
    }

    const admin = await Admin.findById(req.admin._id);

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        success: true,
        message: 'Password verified'
      });
    } else {
      res.status(401);
      throw new Error('Invalid password');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  verifyAdminPassword
};
