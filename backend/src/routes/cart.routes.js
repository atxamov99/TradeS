const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validators/cart.validator');

router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', validate(addToCartSchema), cartController.addToCart);
router.delete('/clear', cartController.clearCart);
router.patch('/item/:productId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/item/:productId', cartController.removeFromCart);

module.exports = router;
