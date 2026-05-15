const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  frameStock: {
    type: Number,
    required: true,
    default: 0
  },
  laminationStock: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
