const affiliateRepository = require('../repositories/affiliateRepository');
const commissionRepository = require('../repositories/commissionRepository');
const userRepository = require('../repositories/userRepository');
const codeGenerator = require('../helpers/codeGenerator');
const config = require('../config/env');
const { AFFILIATE_LINK_TYPES } = require('../constants/affiliateLink.constants');
const ApiError = require('../utils/apiError');

class AffiliateService {
  async getUserLinks(userId) {
    return affiliateRepository.findLinksByUserId(userId);
  }

  async getOrCreateSystemLink(userId, role, linkType) {
    const existing = await affiliateRepository.findSystemLinkByUserAndType(userId, linkType);
    if (existing) return existing;
    if (linkType === AFFILIATE_LINK_TYPES.RECRUITMENT && role !== 'super_affiliate') return null;
    const user = await userRepository.findById(userId);
    const affiliateName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    const referralCode = codeGenerator.generateReferralCode(linkType === AFFILIATE_LINK_TYPES.RECRUITMENT ? 'SUPTEAM' : (role === 'super_affiliate' ? 'SUP' : 'AFF'), affiliateName);
    const targetUrl = linkType === AFFILIATE_LINK_TYPES.RECRUITMENT ? `${config.frontendUrl.replace(/\/$/, '')}/register?ref=${encodeURIComponent(referralCode)}` : config.storefrontUrl;
    return affiliateRepository.createLink({ userId, referralCode, targetUrl, linkType, isSystemLink: true, title: linkType === AFFILIATE_LINK_TYPES.RECRUITMENT ? 'Default Recruitment Link' : 'Default Shopping Link' });
  }

  async createCustomLink(userId, { targetUrl, title, referralCode: requestedCode }) {
    let referralCode;
    if (requestedCode?.trim()) {
      referralCode = codeGenerator.nameToCodePrefix(requestedCode, '');
      if (!referralCode) throw ApiError.badRequest('Enter a referral name using letters or numbers');
    } else {
      const user = await userRepository.findById(userId);
      const affiliateName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
      referralCode = codeGenerator.generateReferralCode('AFF', affiliateName);
    }
    // When no campaign destination is supplied, send referral traffic to the
    // storefront instead of creating a redirect back to the referral URL.
    const finalTargetUrl = targetUrl || config.storefrontUrl;
    try {
      return await affiliateRepository.createLink({
        userId,
        referralCode,
        targetUrl: finalTargetUrl,
        title: title || 'Custom Campaign Link',
      });
    } catch (error) {
      if (error.code === '23505') throw ApiError.conflict('This referral name is already in use. Please choose another one.');
      throw error;
    }
  }

  async getAffiliateEarnings(userId) {
    const commissions = await commissionRepository.findCommissionsByAffiliate(userId);
    const clickCount = await affiliateRepository.getClickStats(userId);

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;

    commissions.forEach((comm) => {
      const amt = parseFloat(comm.amount);
      if (comm.status === 'paid') {
        paidEarnings += amt;
        totalEarnings += amt;
      } else if (comm.status === 'approved' || comm.status === 'pending') {
        pendingEarnings += amt;
        totalEarnings += amt;
      }
    });

    return {
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      totalClicks: clickCount,
      totalConversions: commissions.length,
      commissions,
    };
  }
}

module.exports = new AffiliateService();
