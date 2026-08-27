const db = require('../database');

class CommissionRepository {
  async findActiveRule(client = db) {
    const res = await client.query(
      `SELECT * FROM commission_rules WHERE is_active = true AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0] || null;
  }

  async findMatchingRule({ eventType = 'generic', eligibleAmount }, client = db) {
    const res = await client.query(
      `SELECT * FROM commission_rules WHERE event_type=$1 AND is_active=TRUE AND deleted_at IS NULL
       AND minimum_amount <= $2 AND (maximum_amount IS NULL OR maximum_amount >= $2)
       ORDER BY minimum_amount DESC LIMIT 1`, [eventType, eligibleAmount]
    );
    return res.rows[0] || null;
  }

  async findAllRules() {
    const res = await db.query(
      `SELECT cr.*, p.first_name, p.last_name 
       FROM commission_rules cr
       LEFT JOIN users u ON cr.created_by = u.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE cr.deleted_at IS NULL 
       ORDER BY cr.created_at DESC`
    );
    return res.rows;
  }

  async createRule({ name, type, value, eventType = 'generic', minimumAmount = 0, maximumAmount = null, commissionBase = 'NET', createdBy }) {
    const res = await db.query(
      `INSERT INTO commission_rules (name, type, value, event_type, minimum_amount, maximum_amount, commission_base, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, type, value, eventType, minimumAmount, maximumAmount, commissionBase, createdBy]
    );
    return res.rows[0];
  }

  async createConversion({ clickId, referralId, affiliateId, orderId, amount, grossAmount = amount, discountAmount = 0, eligibleAmount = amount, currency = 'INR' }, client = db) {
    const res = await client.query(
      `INSERT INTO conversion_events (click_id, referral_id, affiliate_id, order_id, amount, gross_amount, discount_amount, eligible_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [clickId, referralId, affiliateId, orderId, amount, grossAmount, discountAmount, eligibleAmount, currency]
    );
    return res.rows[0];
  }

  async findConversionByOrderId(orderId, client = db) {
    const res = await client.query(
      `SELECT ce.*, c.id AS commission_id, c.amount AS commission_amount, c.rate AS commission_rate, c.status AS commission_status
       FROM conversion_events ce
       LEFT JOIN commissions c ON c.conversion_id = ce.id AND c.deleted_at IS NULL
       WHERE ce.order_id = $1 AND ce.deleted_at IS NULL
       LIMIT 1`,
      [orderId]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      commission: row.commission_id
        ? { id: row.commission_id, amount: row.commission_amount, rate: row.commission_rate, status: row.commission_status }
        : null,
    };
  }

  async createCommission({ affiliateId, conversionId, ruleId, amount, rate, status = 'pending', commissionType = 'DIRECT' }, client = db) {
    const res = await client.query(
      `INSERT INTO commissions (affiliate_id, conversion_id, rule_id, amount, rate, status, commission_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [affiliateId, conversionId, ruleId, amount, rate, status, commissionType]
    );
    return res.rows[0];
  }

  async findCommissionsByAffiliate(affiliateId) {
    const res = await db.query(
      `SELECT c.*, ce.order_id, ce.amount as order_amount, ce.currency
       FROM commissions c
       LEFT JOIN conversion_events ce ON c.conversion_id = ce.id
       WHERE c.affiliate_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [affiliateId]
    );
    return res.rows;
  }

  async updateCommissionStatus(commissionId, status, client = db) {
    const res = await client.query(
      `UPDATE commissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, commissionId]
    );
    return res.rows[0];
  }

  async findMaturedPendingCommissions(holdHours = 24) {
    const res = await db.query(
      `SELECT c.*, w.id AS wallet_id
       FROM commissions c
       LEFT JOIN wallets w ON w.user_id = c.affiliate_id AND w.deleted_at IS NULL
       WHERE c.status = 'pending'
         AND c.created_at <= (CURRENT_TIMESTAMP - INTERVAL '1 hour' * $1)
         AND c.deleted_at IS NULL`,
      [holdHours]
    );
    return res.rows;
  }

  async getDashboardSummary(userId = null, role = null) {
    if (role === 'affiliate' || role === 'super_affiliate') {
      const statsRes = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'approved' THEN amount ELSE 0 END), 0) as total_paid,
           COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
           COUNT(id) as total_commissions
         FROM commissions
         WHERE affiliate_id = $1 AND deleted_at IS NULL`,
        [userId]
      );
      return statsRes.rows[0];
    } else {
      // Global Admin Summary
      const statsRes = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'approved' THEN amount ELSE 0 END), 0) as total_commission_paid,
           COALESCE(SUM(amount), 0) as total_revenue_generated,
           COUNT(id) as total_conversions
         FROM commissions
         WHERE deleted_at IS NULL`
      );
      return statsRes.rows[0];
    }
  }
}

module.exports = new CommissionRepository();
