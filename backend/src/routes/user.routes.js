const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  updateProfileSchema,
  addressSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), userController.changePassword);

// Address management
router.post('/addresses', validate(addressSchema), userController.addAddress);
router.patch('/addresses/:addressId', validate(addressSchema), userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// Push notification token
router.post('/push-token', userController.savePushToken);

module.exports = router;
