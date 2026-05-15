const express = require('express');
const router = express.Router();
const { getInventory, updateInventory } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInventory)
  .put(protect, updateInventory);

module.exports = router;
