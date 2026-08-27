const winston = require('winston');
const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'affiliate-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api.log', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
  ],
});

module.exports = logger;
