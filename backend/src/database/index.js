const { Pool } = require('pg');
const config = require('../config/env');
const logger = require('../logs/logger');

// Auto-detect if SSL is required for remote host (e.g. Supabase, Render, AWS, Neon)
const isRemoteDb = config.dbUrl && (
  config.dbUrl.includes('supabase') ||
  config.dbUrl.includes('render.com') ||
  config.dbUrl.includes('neon.tech') ||
  config.dbUrl.includes('aws') ||
  config.dbUrl.includes('sslmode=require') ||
  config.env === 'production'
);

const connectionString = (config.dbUrl || '').replace('sslmode=require', 'sslmode=verify-full');

const pool = new Pool({
  connectionString,
  max: config.dbMax,
  idleTimeoutMillis: config.dbIdleTimeout,
  connectionTimeoutMillis: 10000,
  ssl: isRemoteDb ? { rejectUnauthorized: config.dbSslRejectUnauthorized } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Execute parameterized SQL query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed DB Query', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('DB Query Error', { text, error: error.message });
    throw error;
  }
};

/**
 * Helper to get a transaction client
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  getClient,
  connect: getClient, // Alias for backward compatibility & safety
  pool,
};
