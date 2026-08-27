const marketingAssetRepository = require('../repositories/marketingAssetRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../helpers/responseHelper');
const config = require('../config/env');

class MarketingAssetController {
  getAssets = asyncHandler(async (req, res) => {
    const assets = await marketingAssetRepository.findAll();
    
    // Fetch user's primary referral code if available
    let referralCode = 'DEMO123';
    try {
      const primaryLink = await affiliateRepository.getPrimaryLink(req.user.id);
      if (primaryLink) {
        referralCode = primaryLink.referral_code;
      }
    } catch (e) {}

    const storeUrl = config.storefrontUrl || 'https://veggieradiance.com/';

    const formattedAssets = assets.map((asset) => {
      const referralUrl = `${config.frontendUrl}/ref/${referralCode}`;
      const embedHtml = `<a href="${referralUrl}" target="_blank" rel="noopener noreferrer"><img src="${asset.image_url}" alt="${asset.title}" width="${(asset.dimensions || '728x90').split('x')[0]}" height="${(asset.dimensions || '728x90').split('x')[1] || '90'}" /></a>`;
      return {
        ...asset,
        referralCode,
        referralUrl,
        embedHtml,
      };
    });

    return sendSuccess(res, 'Marketing assets retrieved successfully', formattedAssets);
  });

  createAsset = asyncHandler(async (req, res) => {
    const { title, assetType, imageUrl, dimensions, description } = req.body;
    const asset = await marketingAssetRepository.create({
      title,
      assetType,
      imageUrl,
      dimensions,
      description,
    });
    return sendSuccess(res, 'Marketing asset created successfully', asset, 201);
  });

  deleteAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asset = await marketingAssetRepository.delete(id);
    return sendSuccess(res, 'Marketing asset deleted successfully', asset);
  });
}

module.exports = new MarketingAssetController();
