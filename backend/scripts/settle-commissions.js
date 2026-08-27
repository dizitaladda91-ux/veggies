const commissionService = require('../src/services/commissionService');
const logger = require('../src/utils/logger');

async function main() {
  const holdHours = parseInt(process.env.HOLD_HOURS || '24', 10);
  logger.info(`Starting automated commission settlement for hold period of ${holdHours} hours...`);
  try {
    const result = await commissionService.autoSettleMaturedCommissions(holdHours);
    logger.info(`Settlement completed successfully! ${result.settledCount} commissions settled. Total amount: ₹${result.totalSettledAmount.toFixed(2)}`);
    process.exit(0);
  } catch (error) {
    logger.error('Settlement script failed:', error);
    process.exit(1);
  }
}

main();
