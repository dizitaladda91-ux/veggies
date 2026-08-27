const fs = require('fs');
const path = require('path');
const db = require('./index');
const logger = require('../logs/logger');

const runSeed = async () => {
  try {
    logger.info('Starting Database Seeding...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await db.query(seedSql);
    logger.info('Database Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
