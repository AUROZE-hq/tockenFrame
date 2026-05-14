const Order = require('../models/Order');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const whatsappService = require('../services/whatsappService');
const SmsMessageLog = require('../models/SmsMessageLog');
const smsService = require('../services/smsService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { photoNumber, customerName, phoneNumber, address, orderType, serviceType } = req.body;

    if (!photoNumber || !customerName || !phoneNumber || !orderType || !serviceType) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    if (orderType === 'preorder' && (!address || address.trim() === '')) {
      res.status(400);
      throw new Error('Address is required for preorder');
    }

    // Calculate token number for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orderCountToday = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const tokenNumber = orderCountToday + 1;

    const order = new Order({
      photoNumber,
      customerName,
      phoneNumber,
      address: address || "",
      orderType,
      serviceType,
      tokenNumber
    });

    const createdOrder = await order.save();

    // Call WhatsApp stub
    const whatsappResponse = await whatsappService.sendOrderPlacedMessage(createdOrder);
    
    // Save Log
    await WhatsAppMessageLog.create({
      orderId: createdOrder._id,
      phoneNumber: createdOrder.phoneNumber,
      messageType: 'order_placed',
      messageText: 'Your order has been successfully placed.',
      messageStatus: whatsappResponse.success ? (whatsappResponse.simulated ? 'simulated' : 'sent') : 'failed',
      sentAt: new Date()
    });

    // Send SMS
    let smsStatus = { status: 'not_attempted' };
    try {
      const smsResponse = await smsService.sendOrderPlacedSMS(createdOrder);
      
      await SmsMessageLog.create({
        orderId: createdOrder._id,
        phoneNumber: createdOrder.phoneNumber,
        normalizedPhoneNumber: smsResponse.normalizedPhoneNumber,
        messageType: 'order_placed',
        messageText: `Order Placed SMS Template (Photo No: ${createdOrder.photoNumber})`,
        messageStatus: smsResponse.status,
        providerResponse: smsResponse.providerResponse,
        errorMessage: smsResponse.errorMessage || '',
        sentAt: smsResponse.success ? new Date() : null
      });

      smsStatus = {
        status: smsResponse.status,
        ...(smsResponse.errorMessage && { errorMessage: smsResponse.errorMessage })
      };
    } catch (smsError) {
      smsStatus = {
        status: 'failed',
        errorMessage: smsError.message
      };
    }

    res.status(201).json({
      success: true,
      message: smsStatus.status === 'sent' ? 'Order created successfully' : 'Order created successfully, but SMS failed',
      data: createdOrder,
      sms: smsStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const { search, orderType, serviceType, workStatus, deliveryStatus, cancelled } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { photoNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (orderType && orderType !== 'all') query.orderType = orderType;
    if (serviceType && serviceType !== 'all') query.serviceType = serviceType;
    if (workStatus && workStatus !== 'all') query.workStatus = workStatus;
    if (deliveryStatus && deliveryStatus !== 'all') query.deliveryStatus = deliveryStatus;
    if (cancelled !== undefined && cancelled !== 'all') {
      query.isCancelled = cancelled === 'true';
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.json({ success: true, data: order });
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res, next) => {
  try {
    const { photoNumber, customerName, phoneNumber, address, orderType, serviceType } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (orderType === 'preorder' && (!address || address.trim() === '')) {
      res.status(400);
      throw new Error('Address is required for preorder');
    }

    order.photoNumber = photoNumber || order.photoNumber;
    order.customerName = customerName || order.customerName;
    order.phoneNumber = phoneNumber || order.phoneNumber;
    order.address = address !== undefined ? address : order.address;
    order.orderType = orderType || order.orderType;
    order.serviceType = serviceType || order.serviceType;

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Delete related logs
    await WhatsAppMessageLog.deleteMany({ orderId: order._id });
    
    // Delete order
    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.isCancelled = true;
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark work done
// @route   PATCH /api/orders/:id/work-done
// @access  Private
const markWorkDone = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.workStatus = 'done';
    const updatedOrder = await order.save();

    let finalSmsStatus = null;

    if (order.orderType === 'onspot') {
      const whatsappResponse = await whatsappService.sendWorkCompletedMessage(order);
      await WhatsAppMessageLog.create({
        orderId: order._id,
        phoneNumber: order.phoneNumber,
        messageType: 'work_completed',
        messageText: 'Your order is complete. You can collect it from the delivery area.',
        messageStatus: whatsappResponse.success ? (whatsappResponse.simulated ? 'simulated' : 'sent') : 'failed',
        sentAt: new Date()
      });

      // Send SMS
      let smsStatus = { status: 'not_attempted' };
      try {
        const smsResponse = await smsService.sendWorkCompletedSMS(order);
        
        await SmsMessageLog.create({
          orderId: order._id,
          phoneNumber: order.phoneNumber,
          normalizedPhoneNumber: smsResponse.normalizedPhoneNumber,
          messageType: 'work_completed',
          messageText: `Work Completed SMS Template`,
          messageStatus: smsResponse.status,
          providerResponse: smsResponse.providerResponse,
          errorMessage: smsResponse.errorMessage || '',
          sentAt: smsResponse.success ? new Date() : null
        });

        smsStatus = {
          status: smsResponse.status,
          ...(smsResponse.errorMessage && { errorMessage: smsResponse.errorMessage })
        };
        finalSmsStatus = smsStatus;
      } catch (smsError) {
        console.error('Work Done SMS Error:', smsError);
      }

    } else {
      // Preorder
      await WhatsAppMessageLog.create({
        orderId: order._id,
        phoneNumber: order.phoneNumber,
        messageType: 'work_completed',
        messageText: 'No completion message required for preorder.',
        messageStatus: 'not_required',
        sentAt: new Date()
      });
    }

    res.json({
      success: true,
      message: finalSmsStatus?.status === 'failed' ? 'Work marked as done, but SMS failed' : 'Work marked as done',
      data: updatedOrder,
      sms: finalSmsStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark delivery done
// @route   PATCH /api/orders/:id/delivery-done
// @access  Private
const markDeliveryDone = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.deliveryStatus = 'delivered';
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Delivery marked as done',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all orders and whatsapp logs
// @route   DELETE /api/orders/clear/all
// @access  Private
const clearAllOrders = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Admin password is required');
    }

    const admin = await Admin.findById(req.admin._id);

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin password'
      });
    }

    await Order.deleteMany({});
    await WhatsAppMessageLog.deleteMany({});
    await SmsMessageLog.deleteMany({});

    res.json({
      success: true,
      message: 'All order data cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  cancelOrder,
  markWorkDone,
  markDeliveryDone,
  clearAllOrders
};
