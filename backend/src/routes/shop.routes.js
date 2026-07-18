const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createShopSchema, addMemberSchema } = require('../validators/shop.validator');

router.use(protect);

router.get('/', shopController.getMyShops);
router.post('/', validate(createShopSchema), shopController.createShop);

router.get('/:shopId/members', shopController.getShopMembers);
router.post('/:shopId/members', validate(addMemberSchema), shopController.addMember);
router.delete('/:shopId/members/:userId', shopController.removeMember);

module.exports = router;
