const express = require('express');
const router = express.Router();

const saleController = require('../controllers/sale.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireShopMember } = require('../middlewares/shopRole.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createSaleSchema, bulkSyncSchema } = require('../validators/sale.validator');

router.use(protect);

// Reading own sales stays open; recording a sale is a seller action and now
// requires shop membership — a plain USER can no longer post sales.
router.get('/', saleController.getSales);
router.post('/', requireShopMember, validate(createSaleSchema), saleController.createSale);
router.post('/bulk-sync', requireShopMember, validate(bulkSyncSchema), saleController.bulkSync);

module.exports = router;
