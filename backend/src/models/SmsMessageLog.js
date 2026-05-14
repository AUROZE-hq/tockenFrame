const mongoose = require('mongoose');

const smsMessageLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  phoneNumber: String,
  normalizedPhoneNumber: String,
  messageType: {
    type: String,
    enum: ["order_placed", "work_completed"]
  },
  messageText: String,
  messageStatus: {
    type: String,
    enum: ["sent", "failed", "not_required", "simulated"]
  },
  provider: {
    type: String,
    default: "notify_lk"
  },
  providerResponse: mongoose.Schema.Types.Mixed,
  errorMessage: {
    type: String,
    default: ""
  },
  sentAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('SmsMessageLog', smsMessageLogSchema);
