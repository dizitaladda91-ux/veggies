const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const commissionService = require('./services/commissionService');

const server = app.listen(config.port, () => {
  const dbHost = config.dbUrl ? config.dbUrl.split('@')[1] || 'configured' : 'not set';
  logger.info(`=======================================================`);
  logger.info(` Affiliate Management Server running on port ${config.port}`);
  logger.info(` Environment: ${config.env}`);
  logger.info(` Database Host: ${dbHost}`);
  logger.info(` API: http://localhost:${config.port}${config.apiPrefix || '/'}`);
  logger.info(`=======================================================`);

  // Automated 24-Hour Commission Auto-Settlement Scheduler
  const run24hAutoSettlement = async () => {
    try {
      await commissionService.autoSettleMaturedCommissions(24);
    } catch (err) {
      logger.error('Background 24h auto-settlement error:', err.message);
    }
  };

  // Run 10 seconds after server starts, then check every 30 minutes
  setTimeout(run24hAutoSettlement, 10000);
  setInterval(run24hAutoSettlement, 30 * 60 * 1000);
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
