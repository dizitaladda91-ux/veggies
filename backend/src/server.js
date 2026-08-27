const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  const dbHost = config.dbUrl ? config.dbUrl.split('@')[1] || 'configured' : 'not set';
  logger.info(`=======================================================`);
  logger.info(` Affiliate Management Server running on port ${config.port}`);
  logger.info(` Environment: ${config.env}`);
  logger.info(` Database Host: ${dbHost}`);
  logger.info(` API: http://localhost:${config.port}${config.apiPrefix || '/'}`);
  logger.info(`=======================================================`);
});

const unexpectedErrorHandler = (error) => {
  logger.error('Uncaught Exception / Rejection:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close();
  }
});
