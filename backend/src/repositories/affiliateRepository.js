const db = require('../database');

class AffiliateRepository {
  async createLink({ userId, referralCode, targetUrl, title = 'Main Referral Link', linkType = 'SHOPPING', isSystemLink = false }) {
    const res = await db.query(
      `INSERT INTO affiliate_links (user_id, referral_code, target_url, title, link_type, is_system_link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, referralCode, targetUrl, title, linkType, isSystemLink]
    );
    return res.rows[0];
  }

  async findLinkByCode(referralCode, client = db) {
    const res = await client.query(
      `SELECT al.*, u.status as user_status, u.parent_affiliate_id, r.name AS affiliate_role
       FROM affiliate_links al
       JOIN users u ON al.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(al.referral_code) = LOWER($1) AND al.deleted_at IS NULL`,
      [referralCode]
    );
    return res.rows[0] || null;
  }

  async findValidClick({ clickId, affiliateLinkId, referralCode }, client = db) {
    const res = await client.query(
      `SELECT id FROM click_events
       WHERE id=$1 AND affiliate_link_id=$2 AND LOWER(referral_code)=LOWER($3)
         AND deleted_at IS NULL
       LIMIT 1`,
      [clickId, affiliateLinkId, referralCode]
    );
    return res.rows[0] || null;
  }

  async findLinksByUserId(userId) {
    const res = await db.query(
      `SELECT
         al.*,
         COUNT(DISTINCT ce.id)::INTEGER AS tracked_clicks,
         COUNT(DISTINCT cv.id)::INTEGER AS conversion_count
       FROM affiliate_links al
       LEFT JOIN click_events ce
         ON ce.affiliate_link_id = al.id AND ce.deleted_at IS NULL
       LEFT JOIN conversion_events cv
         ON cv.click_id = ce.id AND cv.deleted_at IS NULL
       WHERE al.user_id = $1 AND al.deleted_at IS NULL
       GROUP BY al.id
       ORDER BY al.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async findSystemLinkByUserAndType(userId, linkType) {
    const res = await db.query(
      `SELECT * FROM affiliate_links WHERE user_id=$1 AND link_type=$2 AND is_system_link=TRUE
       AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`, [userId, linkType]
    );
    return res.rows[0] || null;
  }

  async recordClick({ affiliateLinkId, referralCode, linkType = null, ipAddress, userAgent, referrerUrl }) {
    // 1. Insert click event
    const res = await db.query(
      `INSERT INTO click_events (affiliate_link_id, referral_code, link_type, ip_address, user_agent, referrer_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [affiliateLinkId, referralCode, linkType, ipAddress, userAgent, referrerUrl]
    );

    // 2. Increment click count on affiliate link
    if (affiliateLinkId) {
      await db.query(
        `UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = $1`,
        [affiliateLinkId]
      );
    }

    return res.rows[0];
  }

  async getClickStats(userId) {
    const res = await db.query(
      `SELECT COUNT(ce.id) as total_clicks
       FROM click_events ce
       JOIN affiliate_links al ON ce.affiliate_link_id = al.id
       WHERE al.user_id = $1 AND ce.deleted_at IS NULL`,
      [userId]
    );
    return parseInt(res.rows[0].total_clicks || 0, 10);
  }
}

module.exports = new AffiliateRepository();
