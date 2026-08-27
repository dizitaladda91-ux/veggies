/**
 * Email Service Test Utility
 * Use this to test email functionality in development
 */

const emailService = require('./emailService');

async function testEmailService() {
  console.log('🚀 Testing Email Service...\n');

  const testUser = {
    id: 'test-user-123',
    email: 'test@ethereal.email',
    firstName: 'John',
    lastName: 'Doe',
  };

  const testAffiliate = {
    id: 'affiliate-123',
    email: 'affiliate@ethereal.email',
    firstName: 'Jane',
    lastName: 'Smith',
    company: 'Test Affiliate Co',
  };

  const testWithdrawal = {
    id: 'withdrawal-123',
    amount: 250.50,
    status: 'pending',
    requested_at: new Date(),
    bank_account_number: '1234567890123456',
  };

  const testCommission = {
    id: 'commission-123',
    amount: 50.00,
    referral_code: 'AFF-12345',
    created_at: new Date(),
  };

  try {
    // Test 1: Welcome Email
    console.log('📧 Test 1: Sending Welcome Email...');
    const welcomeResult = await emailService.sendWelcomeEmail(testAffiliate);
    console.log('Result:', welcomeResult);
    console.log('---\n');

    // Test 2: Withdrawal Request Email
    console.log('📧 Test 2: Sending Withdrawal Request Email...');
    const withdrawalResult = await emailService.sendWithdrawalRequestEmail(testUser, testWithdrawal);
    console.log('Result:', withdrawalResult);
    console.log('---\n');

    // Test 3: Commission Earned Email
    console.log('📧 Test 3: Sending Commission Earned Email...');
    const commissionResult = await emailService.sendCommissionEmail(testUser, testCommission);
    console.log('Result:', commissionResult);
    console.log('---\n');

    // Test 4: Withdrawal Approved Email
    console.log('📧 Test 4: Sending Withdrawal Approved Email...');
    const approvedResult = await emailService.sendWithdrawalApprovedEmail(testUser, {
      amount: 250.50,
      approved_at: new Date(),
    });
    console.log('Result:', approvedResult);
    console.log('---\n');

    // Test 5: Withdrawal Rejected Email
    console.log('📧 Test 5: Sending Withdrawal Rejected Email...');
    const rejectedResult = await emailService.sendWithdrawalRejectedEmail(testUser, {
      amount: 100.00,
    }, 'Insufficient verification documents');
    console.log('Result:', rejectedResult);
    console.log('---\n');

    // Test 6: Password Reset Email
    console.log('📧 Test 6: Sending Password Reset Email...');
    const resetResult = await emailService.sendPasswordResetEmail(testUser, 'reset-token-abc123');
    console.log('Result:', resetResult);
    console.log('---\n');

    // Test 7: New Affiliate Notification to Admin
    console.log('📧 Test 7: Sending New Affiliate Notification to Admin...');
    const notificationResult = await emailService.sendNewAffiliateNotificationToAdmin(testAffiliate, 'admin@ethereal.email');
    console.log('Result:', notificationResult);
    console.log('---\n');

    console.log('✅ All email tests completed!');
    if (testWithdrawal.status === 'pending') {
      console.log('\n💡 Tip: For testing with Ethereal (test provider), check the preview URL provided in the console.');
    }
  } catch (error) {
    console.error('❌ Error during email testing:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testEmailService();
}

module.exports = { testEmailService };

// Keep this file runnable as a manual development utility while also making
// it a valid Jest test file. Network email delivery is deliberately not run
// in automated tests.
if (typeof describe === 'function') {
  describe('email service', () => {
    test('exposes the notification methods used by application workflows', () => {
      expect(typeof emailService.sendWelcomeEmail).toBe('function');
      expect(typeof emailService.sendPasswordResetEmail).toBe('function');
      expect(typeof emailService.sendWithdrawalRequestEmail).toBe('function');
    });
  });
}
