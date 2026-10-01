const express = require('express');
const router = express.Router();

const contentController = require('../controllers/content.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createContentSchema, updateContentStatusSchema } = require('../validators/content.validator');

// Public: published content only (help/FAQ, home banner) — no login required,
// since a new user needs self-serve help before they even have an account.
router.get('/public', contentController.getPublicContent);

router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', contentController.getContent);
router.post('/', validate(createContentSchema), contentController.createContent);
router.patch('/:id/status', validate(updateContentStatusSchema), contentController.updateContentStatus);
router.delete('/:id', contentController.deleteContent);

module.exports = router;
