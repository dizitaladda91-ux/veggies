jest.mock('../repositories/affiliateRepository', () => ({ createLink: jest.fn() }));
jest.mock('../repositories/commissionRepository', () => ({}));
jest.mock('../repositories/userRepository', () => ({ findById: jest.fn() }));

const affiliateService = require('../services/affiliateService');
const affiliateRepository = require('../repositories/affiliateRepository');

describe('affiliate custom referral names', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a usable, name-based referral code selected by the affiliate', async () => {
    affiliateRepository.createLink.mockResolvedValue({ referral_code: 'DIVYANSHU-SHARMA' });

    await affiliateService.createCustomLink(7, { title: 'My link', referralCode: 'Divyanshu Sharma' });

    expect(affiliateRepository.createLink).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      referralCode: 'DIVYANSHU-SHARMA',
    }));
  });

  it('explains when an affiliate name is already taken', async () => {
    affiliateRepository.createLink.mockRejectedValue({ code: '23505' });

    await expect(affiliateService.createCustomLink(7, { referralCode: 'Divyanshu' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
