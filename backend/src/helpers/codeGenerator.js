const crypto = require('crypto');

/**
 * Converts an affiliate's name into a short referral-code prefix. Unicode
 * letters are retained so an affiliate's name is not discarded when it is
 * entered in a non-English script.
 * The code still includes random entropy, so people with the same name get
 * distinct links (for example, ADA-LOVELACE-HJ72KS).
 */
const nameToCodePrefix = (name, fallback = 'AFF') => {
  const normalized = String(name || '')
    .normalize('NFC')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 35);

  return normalized || fallback;
};

/**
 * Generates a name-based, high-entropy referral code (e.g. ADA-LOVELACE-HJ72KS).
 */
const generateReferralCode = (fallback = 'AFF', name = '') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like O, 0, I, 1
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${nameToCodePrefix(name, fallback)}-${code}`;
};

module.exports = {
  generateReferralCode,
  nameToCodePrefix,
};
