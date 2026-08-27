const express = require('express');
const router = express.Router();

const authRoutes = require('../authRoutes');
const adminRoutes = require('../adminRoutes');
const affiliateRoutes = require('../affiliateRoutes');
const referralRoutes = require('../referralRoutes');
const commissionRoutes = require('../commissionRoutes');
const dashboardRoutes = require('../dashboardRoutes');
const profileRoutes = require('../profileRoutes');
const settingsRoutes = require('../settingsRoutes');
const paymentRoutes = require('../paymentRoutes');
const payoutRoutes = require('../payout.routes');
const bankAccountRoutes = require('../bankAccount.routes');
const walletRoutes = require('../walletroutes');
const withdrawalRoutes = require('../withdrawalroutes');
const adminWithdrawalRoutes = require('../adminWithdrawalRoutes');
const marketingAssetRoutes = require('../marketingAssetRoutes');
const notificationRoutes = require('../notificationRoutes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/affiliates', affiliateRoutes);
router.use('/referrals', referralRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/admin/withdrawals', adminWithdrawalRoutes);
router.use('/settings', settingsRoutes);
router.use('/payments', paymentRoutes);
router.use('/marketing-assets', marketingAssetRoutes);
router.use('/payouts', payoutRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
