const db = require('./index');
const logger = require('../logs/logger');

const protectedTables = [
  'roles',
  'permissions',
  'role_permissions',
  'schema_migrations',
  'migrations',
  'knex_migrations',
  'knex_migrations_lock',
];

const clearTestData = async () => {
  if (process.env.CLEAR_TEST_DATA !== 'true') {
    throw new Error('Set CLEAR_TEST_DATA=true to clear application data.');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT quote_ident(schemaname) || '.' || quote_ident(tablename) AS table_name
       FROM pg_tables
       WHERE schemaname = current_schema()
         AND tablename <> ALL($1::text[])
       ORDER BY tablename`,
      [protectedTables]
    );

    if (rows.length) {
      await client.query(`TRUNCATE TABLE ${rows.map(({ table_name }) => table_name).join(', ')} RESTART IDENTITY CASCADE`);
    }
    await client.query('COMMIT');
    logger.info(`Cleared ${rows.length} application-data tables; roles and permission master data were preserved.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
};

clearTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Application data cleanup failed:', { error: error.message });
    process.exit(1);
  });
