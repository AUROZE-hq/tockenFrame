const Inventory = require('../models/Inventory');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// @desc    Get current inventory levels
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    let inventory = await Inventory.findOne();
    
    // Create initial inventory record if none exists
    if (!inventory) {
      inventory = await Inventory.create({ frameStock: 0, laminationStock: 0 });
    }
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory levels
// @route   PUT /api/inventory
// @access  Private
const updateInventory = async (req, res, next) => {
  try {
    const { frameStock, laminationStock, password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Admin password is required to update inventory');
    }

    // Verify admin password
    const admin = await Admin.findById(req.admin._id);
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401);
      throw new Error('Invalid admin password');
    }

    let inventory = await Inventory.findOne();
    if (!inventory) {
      inventory = new Inventory();
    }

    if (frameStock !== undefined) inventory.frameStock = frameStock;
    if (laminationStock !== undefined) inventory.laminationStock = laminationStock;

    const updatedInventory = await inventory.save();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: updatedInventory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  updateInventory
};
