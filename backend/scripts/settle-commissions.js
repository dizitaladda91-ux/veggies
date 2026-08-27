const commissionService = require('../src/services/commissionService');
const logger = require('../src/utils/logger');

async function main() {
  const holdDays = parseInt(process.env.HOLD_DAYS || '7', 10);
  logger.info(`Starting automated commission settlement for hold period of ${holdDays} days...`);
  try {
    const result = await commissionService.autoSettleMaturedCommissions(holdDays);
    logger.info(`Settlement completed successfully! ${result.settledCount} commissions settled. Total amount: ₹${result.totalSettledAmount.toFixed(2)}`);
    process.exit(0);
  } catch (error) {
    logger.error('Settlement script failed:', error);
    process.exit(1);
  }
}

main();
