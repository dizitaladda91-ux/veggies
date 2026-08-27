const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
const generateMfaToken = (payload, purpose) => jwt.sign({ ...payload, purpose }, config.jwt.accessSecret, { expiresIn: '10m' });
const verifyMfaToken = (token, purpose) => {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (decoded.purpose !== purpose) throw new Error('Invalid MFA token purpose');
  return decoded;
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateMfaToken,
  verifyMfaToken,
  hashPassword,
  comparePassword,
};
