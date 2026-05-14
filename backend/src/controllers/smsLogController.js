const SmsMessageLog = require('../models/SmsMessageLog');

// @desc    Get SMS message logs
// @route   GET /api/sms-logs
// @access  Private
const getSmsLogs = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    let query = {};
    
    if (orderId) {
      query.orderId = orderId;
    }

    const logs = await SmsMessageLog.find(query)
      .populate('orderId', 'photoNumber customerName orderType serviceType')
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
  getSmsLogs
};
