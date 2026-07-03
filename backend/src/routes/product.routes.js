const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  reviewSchema,
} = require('../validators/product.validator');

// All product routes require authentication (user-scoped)
router.use(protect);

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

router.post('/', validate(createProductSchema), productController.createProduct);
router.post('/:id/reviews', validate(reviewSchema), productController.addReview);
router.patch('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
