const mongoose = require('mongoose');

const whatsAppMessageLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  phoneNumber: String,
  messageType: {
    type: String,
    enum: ["order_placed", "work_completed"]
  },
  messageText: String,
  messageStatus: {
    type: String,
    enum: ["sent", "failed", "not_required", "simulated"]
  },
  errorMessage: {
    type: String,
    default: ""
  },
  sentAt: Date
}, {
  timestamps: true // adds createdAt automatically
});

const WhatsAppMessageLog = mongoose.model('WhatsAppMessageLog', whatsAppMessageLogSchema);

module.exports = WhatsAppMessageLog;
