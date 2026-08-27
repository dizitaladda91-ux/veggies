const db = require('../database');

class CouponRedemptionRepository {
  async claim({ referralCode, customerEmail, orderId }, client = db) {
    const result = await client.query(
      `INSERT INTO affiliate_coupon_redemptions (referral_code, customer_email, order_id)
       VALUES ($1, LOWER($2), $3)
       ON CONFLICT (referral_code, customer_email) DO NOTHING
       RETURNING *`,
      [referralCode, customerEmail.trim(), orderId]
    );
    return result.rows[0] || null;
  }

  async attachConversion(redemptionId, conversionId, client = db) {
    await client.query(
      'UPDATE affiliate_coupon_redemptions SET conversion_id=$2 WHERE id=$1',
      [redemptionId, conversionId]
    );
  }

  async hasRedeemed({ referralCode, customerEmail }) {
    const result = await db.query(
      `SELECT 1 FROM affiliate_coupon_redemptions
       WHERE referral_code=$1 AND customer_email=LOWER($2)
       LIMIT 1`,
      [referralCode, customerEmail.trim()]
    );
    return Boolean(result.rows[0]);
  }
}

module.exports = new CouponRedemptionRepository();
