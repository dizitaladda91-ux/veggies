jest.mock('../database', () => ({
  connect: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../repositories/payout.repository', () => ({
  lockPayout: jest.fn(),
  processing: jest.fn(),
  success: jest.fn(),
  failed: jest.fn(),
  cancel: jest.fn(),
}));

jest.mock('../repositories/withdrawal.repository', () => ({
  updateStatus: jest.fn(),
  markAsPaid: jest.fn(),
  failed: jest.fn(),
}));

const payoutService = require('../services/withdrawal.service');
const payoutRepository = require('../repositories/payout.repository');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const db = require('../database');

describe('payout concurrency guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
    db.getClient.mockResolvedValue(mockClient);
  });

  it('rejects completion when a payout is already completed', async () => {
    payoutRepository.lockPayout.mockResolvedValue({ id: 1, status: 'SUCCESS' });

    await expect(payoutService.completePayout('1', { transactionReference: 'txn-1' })).rejects.toMatchObject({ statusCode: 409 });
    expect(withdrawalRepository.markAsPaid).not.toHaveBeenCalled();
  });
});
