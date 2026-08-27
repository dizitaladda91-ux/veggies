const { generateReferralCode, nameToCodePrefix } = require('../helpers/codeGenerator');

describe('referral code generator', () => {
  it('uses the affiliate name as a URL-safe code prefix', () => {
    expect(nameToCodePrefix('Ada Lovelace')).toBe('ADA-LOVELACE');
    expect(nameToCodePrefix('दिव्यांशु शर्मा')).toBe('दिव्यांशु-शर्मा');
    expect(generateReferralCode('AFF', 'Ada Lovelace')).toMatch(/^ADA-LOVELACE-[A-Z2-9]{6}$/);
  });

  it('uses the role prefix when no usable name is provided', () => {
    expect(nameToCodePrefix('', 'SUP')).toBe('SUP');
  });
});
