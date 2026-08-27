// Compatibility export for modules that use the legacy `logs/logger` path.
// The canonical logger lives in monitoring so all application logs use the
// same transports and structured format.
module.exports = require('../monitoring/logger');
