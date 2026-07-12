const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin.routes');
const salesRoutes = require('./sales.routes');
const reportsRoutes = require('./reports.routes');
const syncRoutes = require('./sync.routes');
const aiRoutes = require('./ai.routes');
const auditRoutes = require('./audit.routes');
const contentRoutes = require('./content.routes');
const telegramRoutes = require('./telegram.routes');
const settingsRoutes = require('./settings.routes');
const supportRoutes = require('./support.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/sales', salesRoutes);
router.use('/reports', reportsRoutes);
router.use('/sync', syncRoutes);
router.use('/ai', aiRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/content', contentRoutes);
router.use('/telegram', telegramRoutes);
router.use('/settings', settingsRoutes);
router.use('/support', supportRoutes);

module.exports = router;
