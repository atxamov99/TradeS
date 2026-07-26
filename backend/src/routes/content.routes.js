const express = require('express');
const router = express.Router();

const contentController = require('../controllers/content.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect, authorize('ADMIN'));

router.get('/', contentController.getContent);
router.post('/', contentController.createContent);
router.patch('/:id/status', contentController.updateContentStatus);
router.delete('/:id', contentController.deleteContent);

module.exports = router;
