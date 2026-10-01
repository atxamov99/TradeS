const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop.controller');
const productController = require('../controllers/product.controller');
const orderController = require('../controllers/order.controller');
const saleController = require('../controllers/sale.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createShopSchema, updateShopSchema } = require('../validators/shop.validator');
const { updateOrderStatusSchema } = require('../validators/order.validator');

// Same convention as product.routes.js: everything requires a signed-in account.
// "Browse" routes are open to any user, owner-only routes verify ownership in
// the service layer.
router.use(protect);

router.get('/mine', shopController.listMyShops);
router.get('/', shopController.listShops);
router.post('/', validate(createShopSchema), shopController.createShop);

router.get('/:id', shopController.getShopById);
router.patch('/:id', validate(updateShopSchema), shopController.updateShop);

// One shop's catalog — the owner also sees archived products, anyone else only active ones.
router.get('/:id/products', productController.getShopProducts);
// Owner-only: orders buyers placed with this shop, the shop's POS sales, and its
// restock (buy-in) log.
router.get('/:id/orders', orderController.getShopOrders);
router.patch(
  '/:id/orders/:orderId/status',
  validate(updateOrderStatusSchema),
  orderController.updateShopOrderStatus
);
router.get('/:id/sales', saleController.getShopSales);
router.get('/:id/inventory', productController.getShopInventory);

module.exports = router;
