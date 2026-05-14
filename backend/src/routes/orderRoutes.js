const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  cancelOrder,
  markWorkDone,
  markDeliveryDone,
  clearAllOrders
} = require('../controllers/orderController');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.delete('/clear/all', protect, clearAllOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/work-done', protect, markWorkDone);
router.patch('/:id/delivery-done', protect, markDeliveryDone);

module.exports = router;
