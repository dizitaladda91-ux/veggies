const crypto = require('crypto');
const config = require('../config/env');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32Encode = (buffer) => {
  let bits = 0; let value = 0; let output = '';
  for (const byte of buffer) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  return bits ? output + alphabet[(value << (5 - bits)) & 31] : output;
};
const base32Decode = (value) => {
  let bits = 0; let buffer = 0; const out = [];
  for (const char of value.replace(/[\s=]/g, '').toUpperCase()) { const index = alphabet.indexOf(char); if (index < 0) throw new Error('Invalid TOTP secret'); buffer = (buffer << 5) | index; bits += 5; if (bits >= 8) { out.push((buffer >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
};
const key = () => crypto.createHash('sha256').update(config.mfaEncryptionKey).digest();
const encrypt = (plain) => { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv); const content = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${content.toString('base64')}`; };
const decrypt = (value) => { const [iv, tag, content] = value.split('.').map((part) => Buffer.from(part, 'base64')); const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8'); };
const codeFor = (secret, step) => { const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step)); const hash = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest(); const offset = hash[hash.length - 1] & 15; return String(((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)).padStart(6, '0'); };
module.exports = { generateSecret: () => base32Encode(crypto.randomBytes(20)), encrypt, decrypt, verifyCode: (secret, code) => [-1, 0, 1].some((offset) => crypto.timingSafeEqual(Buffer.from(codeFor(secret, Math.floor(Date.now() / 30000) + offset)), Buffer.from(String(code).padStart(6, '0')))) };
