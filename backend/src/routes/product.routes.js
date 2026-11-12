const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireShopMember } = require('../middlewares/shopRole.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  reviewSchema,
  restockSchema,
} = require('../validators/product.validator');

// All product routes require authentication
router.use(protect);

// Reads — global catalog, open to any authenticated user (mobile sync's
// pullProductCatalog depends on this default; do not narrow it here).
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/slug/:slug', productController.getProductBySlug);
// POS barcode scan — static paths, so they must stay BEFORE '/:id'. Both need a
// shop membership; restock-by-scan keeps the OWNER-only rule of /:id/restock.
router.get('/barcode/:code', requireShopMember, productController.getProductByBarcode);
router.patch('/barcode/:code/restock', requireShopMember, validate(restockSchema), productController.restockByBarcode);
router.get('/:id', productController.getProductById);

// Review — a buyer action, not a seller action: stays open to any user.
router.post('/:id/reviews', validate(reviewSchema), productController.addReview);

// Catalog writes — sellers only (shop member or platform staff). Without this
// gate any logged-in USER could create products and set prices like an owner.
router.post('/', requireShopMember, validate(createProductSchema), productController.createProduct);
router.patch('/:id', requireShopMember, validate(updateProductSchema), productController.updateProduct);
router.patch('/:id/restock', requireShopMember, validate(restockSchema), productController.restockProduct);
router.delete('/:id', requireShopMember, productController.deleteProduct);

module.exports = router;
