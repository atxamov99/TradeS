const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

router.use(protect);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

// Admin only
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
