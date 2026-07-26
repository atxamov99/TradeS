const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  reviewSchema,
  restockSchema,
} = require('../validators/product.validator');

// All product routes require authentication (user-scoped)
router.use(protect);

// ── READ routes — any authenticated user (web storefront + admin) ───────────
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

// ── WRITE routes — admin only ──────────────────────────────────────────────
// POST, PATCH (update/restock), DELETE require admin role.
// This prevents regular users from creating/modifying/deleting products.
const adminOnly = authorize('ADMIN', 'SUPER_ADMIN');

router.post('/', adminOnly, validate(createProductSchema), productController.createProduct);
router.post('/:id/reviews', validate(reviewSchema), productController.addReview);
router.patch('/:id', adminOnly, validate(updateProductSchema), productController.updateProduct);
router.patch('/:id/restock', adminOnly, validate(restockSchema), productController.restockProduct);
router.delete('/:id', adminOnly, productController.deleteProduct);

module.exports = router;
