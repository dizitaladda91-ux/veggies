const fs = require('fs');
const path = require('path');
const db = require('./index');
const logger = require('../utils/logger');

const runMigrations = async () => {
  try {
    logger.info('Starting database schema migration...');
    // Production migrations must not create the documented demo accounts.
    // Demo data remains available through the explicit seed command.
    let schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Some existing installations predate the UUID schema and use numeric
    // primary keys. Financial tables must use the same types as their parent
    // keys or PostgreSQL refuses to create the foreign-key constraints.
    const getColumnType = async (tableName, columnName) => {
      const result = await db.query(
        `SELECT format_type(a.atttypid, a.atttypmod) AS type
         FROM pg_attribute a
         JOIN pg_class c ON c.oid = a.attrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = $1
           AND a.attname = $2
           AND a.attnum > 0
           AND NOT a.attisdropped`,
        [tableName, columnName]
      );
      if (!result.rows[0]?.type) {
        logger.warn(`Column ${tableName}.${columnName} was not found yet; defaulting to UUID for a fresh database.`);
        return 'UUID';
      }
      return result.rows[0].type;
    };

    const [userIdType, withdrawRequestIdType] = await Promise.all([
      getColumnType('users', 'id'),
      getColumnType('withdraw_requests', 'id'),
    ]);
    schemaSql = schemaSql
      .replaceAll('__USER_ID_TYPE__', userIdType)
      .replaceAll('__WITHDRAW_REQUEST_ID_TYPE__', withdrawRequestIdType);
    await db.query(schemaSql);
    logger.info('Database schema applied successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

runMigrations();
