const db = require('../database');

class ReferralRepository {
  async createReferral({ referrerId, referredUserId, referralCode, status = 'pending' }) {
    const res = await db.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [referrerId, referredUserId, referralCode, status]
    );
    return res.rows[0];
  }

  async findByReferredUser(referredUserId) {
    const res = await db.query(
      `SELECT * FROM referrals WHERE referred_user_id = $1 AND deleted_at IS NULL`,
      [referredUserId]
    );
    return res.rows[0] || null;
  }

  async findTeamMembers(superAffiliateId, { limit = 20, offset = 0 } = {}) {
    const res = await db.query(
      `SELECT u.id, u.email, u.status, u.created_at, u.parent_affiliate_id, r.name AS role_name,
              p.first_name, p.last_name, p.company,
              ref.referral_code AS referral_source_code,
              COALESCE(SUM(c.amount), 0) as total_earnings,
              COALESCE(COUNT(ce.id), 0) as total_conversions
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN referrals ref ON ref.referred_user_id = u.id AND ref.deleted_at IS NULL
       LEFT JOIN commissions c ON c.affiliate_id = u.id AND c.status = 'paid'
       LEFT JOIN conversion_events ce ON ce.affiliate_id = u.id
       WHERE u.parent_affiliate_id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id, r.name, p.first_name, p.last_name, p.company, ref.referral_code
       ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`,
      [superAffiliateId, limit, offset]
    );
    return res.rows;
  }

  async getTeamStats(superAffiliateId) {
    const res = await db.query(
      `SELECT COUNT(*)::int AS total_team_members,
       COUNT(*) FILTER (WHERE r.name='affiliate')::int AS total_affiliates,
       COUNT(*) FILTER (WHERE r.name='super_affiliate')::int AS total_super_affiliates,
       COUNT(*) FILTER (WHERE u.status='active')::int AS active_members
       FROM users u JOIN roles r ON r.id=u.role_id
       WHERE u.parent_affiliate_id=$1 AND u.deleted_at IS NULL`, [superAffiliateId]
    );
    return res.rows[0];
  }
}

module.exports = new ReferralRepository();
