const db = require('../database');

class LogRepository {
  async createActivityLog({ userId, action, entityType = null, entityId = null, metadata = {}, ipAddress = null }) {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, JSON.stringify(metadata), ipAddress]
    );
  }

  async createAuditLog({ actorId, targetUserId = null, action, changesJson = {}, ipAddress = null }) {
    await db.query(
      `INSERT INTO audit_logs (actor_id, target_user_id, action, changes_json, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorId, targetUserId, action, JSON.stringify(changesJson), ipAddress]
    );
  }

  async getAuditLogs({ limit = 20, offset = 0 }) {
    const res = await db.query(
      `SELECT al.*, 
              pa.first_name as actor_first_name, pa.last_name as actor_last_name, ua.email as actor_email,
              pt.first_name as target_first_name, pt.last_name as target_last_name, ut.email as target_email
       FROM audit_logs al
       LEFT JOIN users ua ON al.actor_id = ua.id
       LEFT JOIN profiles pa ON pa.user_id = ua.id
       LEFT JOIN users ut ON al.target_user_id = ut.id
       LEFT JOIN profiles pt ON pt.user_id = ut.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }
}

module.exports = new LogRepository();
