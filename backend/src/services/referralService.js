const affiliateRepository = require('../repositories/affiliateRepository');
const referralRepository = require('../repositories/referralRepository');
const commissionRepository = require('../repositories/commissionRepository');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const notificationRepository = require('../repositories/notification.repository');
const couponRedemptionRepository = require('../repositories/couponRedemptionRepository');
const { ROLES } = require('../constants/roles');
const { SHOPPING_COMMISSION_TIERS, RECRUITMENT_TEAM_TIERS } = require('../constants/affiliateLink.constants');
const db = require('../database');

const STANDARD_AFFILIATE_TIERS = SHOPPING_COMMISSION_TIERS;
const getStandardAffiliateTier = (amount) =>
  STANDARD_AFFILIATE_TIERS.find((tier) => amount <= tier.maximumOrderAmount);

class ReferralService {
  async trackClick({ referralCode, ipAddress, userAgent, referrerUrl }) {
    const link = await affiliateRepository.findLinkByCode(referralCode);

    let click = null;
    if (link && link.is_active && link.user_status === 'active') {
      try {
        click = await affiliateRepository.recordClick({
          referralCode,
          affiliateLinkId: link.id,
          linkType: link.link_type,
          ipAddress,
          userAgent,
          referrerUrl,
        });
      } catch (err) {
        // Never issue an attributable referral URL if its click could not be
        // persisted; otherwise conversions cannot be securely verified.
        throw ApiError.internal('Unable to record referral click. Please retry.');
      }
    }

    const discountPercent = config.affiliateDiscountPercent || 10;
    const baseTarget = (link && link.target_url) ? link.target_url : (config.storefrontUrl || 'https://veggieradiance.com');

    let targetUrl = baseTarget;
    try {
      const urlObj = new URL(baseTarget.startsWith('http') ? baseTarget : `https://${baseTarget}`);
      urlObj.searchParams.set('ref', referralCode);
      urlObj.searchParams.set('discount', String(discountPercent));
      urlObj.searchParams.set('coupon', referralCode);
      urlObj.searchParams.set('coupon_code', referralCode);
      urlObj.searchParams.set('discount_code', referralCode);
      if (click?.id) urlObj.searchParams.set('clickId', click.id);
      targetUrl = urlObj.toString();
    } catch (e) {
      targetUrl = `${baseTarget}${baseTarget.includes('?') ? '&' : '?'}ref=${referralCode}&discount=${discountPercent}&coupon=${referralCode}&coupon_code=${referralCode}`;
    }

    return {
      clickId: click?.id || null,
      referralCode,
      valid: Boolean(click),
      targetUrl,
      discountPercent,
    };
  }

  async validateCode(referralCode) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    if (!link || link.link_type !== 'SHOPPING' || !link.is_active || link.user_status !== 'active') {
      return { referralCode, valid: false, discountPercent: 0 };
    }

    return {
      referralCode: link.referral_code,
      valid: true,
      discountPercent: config.affiliateDiscountPercent || 10,
    };
  }

  async getAffiliateDiscount(referralCode) {
    return this.validateCode(referralCode);
  }

  async getCouponEligibility(referralCode, customerEmail) {
    const discount = await this.validateCode(referralCode);
    if (!discount.valid) return { ...discount, eligible: false, reason: 'INVALID_REFERRAL' };

    const alreadyRedeemed = await couponRedemptionRepository.hasRedeemed({ referralCode, customerEmail });
    return {
      ...discount,
      eligible: !alreadyRedeemed,
      discountPercent: alreadyRedeemed ? 0 : discount.discountPercent,
      reason: alreadyRedeemed ? 'ALREADY_REDEEMED' : null,
    };
  }

  async processConversion({ referralCode, orderId, customerEmail, amount, grossAmount = amount, discountAmount = 0, eligibleAmount = amount, currency = 'INR', clickId = null }) {
    const client = await db.getClient();
    let result;
    let link;
    let commissionAmount;
    try {
      await client.query('BEGIN');
      link = await affiliateRepository.findLinkByCode(referralCode, client);
      if (!link || link.link_type !== 'SHOPPING' || !link.is_active || link.user_status !== 'active') throw ApiError.notFound(`Invalid referral code: ${referralCode}`);
      const click = await affiliateRepository.findValidClick({ clickId, affiliateLinkId: link.id, referralCode }, client);
      if (!click) throw ApiError.badRequest('Click ID does not belong to this active referral code.');
      const existingConversion = await commissionRepository.findConversionByOrderId(orderId, client);
      if (existingConversion) {
        await client.query('COMMIT');
        return { conversion: existingConversion, commission: null, commissionTier: null, alreadyRecorded: true };
      }
      const isShoppingAffiliate = [ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE].includes(link.affiliate_role);
      const rule = isShoppingAffiliate ? await commissionRepository.findMatchingRule({ eventType: 'shopping', eligibleAmount }, client) : await commissionRepository.findActiveRule(client);
      if (!rule) throw ApiError.badRequest('No active commission rule matches this conversion');
      const redemption = await couponRedemptionRepository.claim({ referralCode, customerEmail, orderId }, client);
      if (!redemption) throw ApiError.conflict('This referral coupon has already been used by this customer.');
      const conversion = await commissionRepository.createConversion({ clickId, referralId: null, affiliateId: link.user_id, orderId, amount, grossAmount, discountAmount, eligibleAmount, currency }, client);
      await couponRedemptionRepository.attachConversion(redemption.id, conversion.id, client);
      const commissionRate = parseFloat(rule.value);
      commissionAmount = rule.type === 'percentage' ? (amount * commissionRate) / 100 : commissionRate;
      const commission = await commissionRepository.createCommission({ affiliateId: link.user_id, conversionId: conversion.id, ruleId: rule.id, amount: commissionAmount.toFixed(2), rate: commissionRate, status: 'pending', commissionType: 'DIRECT' }, client);

    // A recruited affiliate's sale also earns its parent Super Affiliate.
    // Team size 1-15 earns 5%; size 16+ earns 7%.
    let teamCommission = null;
    if (link.affiliate_role === ROLES.AFFILIATE && link.parent_affiliate_id) {
      const teamStats = await referralRepository.getTeamStats(link.parent_affiliate_id);
      const teamSize = Number(teamStats?.total_team_members || 0);
      const teamTier = RECRUITMENT_TEAM_TIERS.find((tier) => teamSize <= tier.maximumTeamMembers);
      const teamRate = teamTier.rate;
      const teamAmount = (amount * teamRate) / 100;

      teamCommission = await commissionRepository.createCommission({
        affiliateId: link.parent_affiliate_id,
        conversionId: conversion.id,
        ruleId: null,
        amount: teamAmount.toFixed(2),
        rate: teamRate,
        status: 'pending',
        commissionType: 'TEAM',
      }, client);

    }

      result = {
        conversion, commission, teamCommission,
        commissionTier: isShoppingAffiliate ? { label: rule.name, rate: commissionRate } : null,
        alreadyRecorded: false,
      };
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error?.code === '23505') {
        const recorded = await commissionRepository.findConversionByOrderId(orderId);
        if (recorded) return { conversion: recorded, commission: null, commissionTier: null, alreadyRecorded: true };
      }
      throw error;
    } finally {
      client.release();
    }

    try {
      notificationRepository.create({
        userId: link.user_id,
        title: 'New Commission Earned! 🎉',
        message: `You earned ₹${commissionAmount.toFixed(2)} commission on order #${orderId}.`,
        type: 'conversion',
      }).catch(() => {});
    } catch (err) {}

    return result;
  }

  async getTeamMembers(superAffiliateId, role, { page = 1, limit = 20 } = {}) {
    if (role !== ROLES.SUPER_AFFILIATE) throw ApiError.forbidden('Only super affiliates can access a recruitment team');
    const safePage = Math.max(1, Number(page)); const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const [items, stats] = await Promise.all([referralRepository.findTeamMembers(superAffiliateId, { limit: safeLimit, offset: (safePage - 1) * safeLimit }), referralRepository.getTeamStats(superAffiliateId)]);
    const total = Number(stats.total_team_members); const tier = RECRUITMENT_TEAM_TIERS.find((item) => total <= item.maximumTeamMembers);
    return { items, stats: { totalTeamMembers: total, totalAffiliates: Number(stats.total_affiliates), totalSuperAffiliates: Number(stats.total_super_affiliates), activeMembers: Number(stats.active_members), currentRecruitmentCommissionRate: tier.rate }, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }
}

module.exports = new ReferralService();
