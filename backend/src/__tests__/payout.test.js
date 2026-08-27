jest.mock('../database', () => ({
  connect: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../repositories/payout.repository', () => ({
  findById: jest.fn(),
  findByPayoutNumber: jest.fn(),
  findByWithdrawRequestId: jest.fn(),
  create: jest.fn(),
  lockPayout: jest.fn(),
  processing: jest.fn(),
  success: jest.fn(),
  failed: jest.fn(),
  cancel: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  getStatistics: jest.fn(),
}));

jest.mock('../repositories/withdrawal.repository', () => ({
  findById: jest.fn(),
  lockWithdrawal: jest.fn(),
  updateStatus: jest.fn(),
  markAsPaid: jest.fn(),
  failed: jest.fn(),
}));

const payoutService = require('../services/withdrawal.service');
const payoutRepository = require('../repositories/payout.repository');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const db = require('../database');

describe('payout service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
    db.getClient.mockResolvedValue(mockClient);
  });

  it('moves a pending payout to processing', async () => {
    payoutRepository.lockPayout.mockResolvedValue({ id: '1', status: 'PENDING' });
    payoutRepository.processing.mockResolvedValue({ id: '1', status: 'PROCESSING' });

    const result = await payoutService.processPayout('1');

    expect(result.status).toBe('PROCESSING');
    expect(payoutRepository.processing).toHaveBeenCalledWith('1', null, null, undefined, expect.anything());
  });

  it('completes a processing payout', async () => {
    payoutRepository.lockPayout.mockResolvedValue({ id: '2', status: 'PROCESSING', withdraw_request_id: 99 });
    payoutRepository.success.mockResolvedValue({ id: '2', status: 'SUCCESS' });

    const result = await payoutService.completePayout('2', { transactionReference: 'TXN123' });

    expect(result.status).toBe('SUCCESS');
    expect(withdrawalRepository.markAsPaid).toHaveBeenCalledWith(99, 'TXN123', expect.anything());
  });
});
