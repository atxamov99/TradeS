const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createShopSchema, addMemberSchema, confirmUpgradeSchema } = require('../validators/shop.validator');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const expenseController = require('../controllers/expense.controller');
const { createExpenseSchema } = require('../validators/expense.validator');

router.use(protect);

router.get('/', shopController.getMyShops);
router.post('/', validate(createShopSchema), shopController.createShop);

router.get('/:shopId/members', shopController.getShopMembers);
router.delete('/:shopId/members/:userId', shopController.removeMember);

// Employees are INVITED, never added directly: the invited user must accept.
// (the "invites/..." paths are declared before "/:shopId/..." so they are not read as a shop id)
router.get('/invites/mine', shopController.getMyInvites);
router.post('/invites/:inviteId/accept', shopController.acceptInvite);
router.post('/invites/:inviteId/decline', shopController.declineInvite);
router.get('/:shopId/invites', shopController.listShopInvites);
router.post('/:shopId/invites', validate(addMemberSchema), shopController.inviteMember);
router.delete('/:shopId/invites/:inviteId', shopController.cancelInvite);

// Solo -> business upgrade, confirmed with a one-time code (OWNER of a personal shop only)
router.post('/:shopId/upgrade/request', authLimiter, shopController.requestBusinessUpgrade);
router.post('/:shopId/upgrade/confirm', authLimiter, validate(confirmUpgradeSchema), shopController.confirmBusinessUpgrade);

// Expenses — shop OWNER only (enforced in expense.service)
router.post('/:shopId/expenses', validate(createExpenseSchema), expenseController.createExpense);
router.get('/:shopId/expenses', expenseController.listExpenses);
router.delete('/:shopId/expenses/:expenseId', expenseController.deleteExpense);

module.exports = router;
