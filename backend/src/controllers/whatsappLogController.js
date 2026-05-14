const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');

// @desc    Get WhatsApp message logs
// @route   GET /api/whatsapp-logs
// @access  Private
const getWhatsAppLogs = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    let query = {};
    
    if (orderId) {
      query.orderId = orderId;
    }

    const logs = await WhatsAppMessageLog.find(query)
      .populate('orderId', 'photoNumber customerName phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWhatsAppLogs
};
