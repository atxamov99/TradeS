const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema } = require('../validators/order.validator');

router.use(protect);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

// NOTE: PATCH /:id/status is handled by admin.routes.js at /admin/orders/:id/status
// (with full admin guard + audit logging). No need to duplicate it here.

module.exports = router;
