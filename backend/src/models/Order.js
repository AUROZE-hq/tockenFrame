const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  photoNumber: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ""
  },
  orderType: {
    type: String,
    enum: ["onspot", "preorder"],
    required: true
  },
  serviceType: {
    type: String,
    enum: ["frame", "lamination", "both"],
    required: true
  },
  workStatus: {
    type: String,
    enum: ["pending", "done"],
    default: "pending"
  },
  deliveryStatus: {
    type: String,
    enum: ["not_delivered", "delivered"],
    default: "not_delivered"
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  tokenNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Validation rule: if preorder, address must be required
orderSchema.pre('save', function(next) {
  if (this.orderType === 'preorder' && (!this.address || this.address.trim() === '')) {
    return next(new Error('Address is required for preorder'));
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
