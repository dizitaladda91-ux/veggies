const db = require('../database');

class NotificationRepository {
  async create({ userId, title, message, type = 'info' }) {
    const res = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING *`,
      [userId, title, message, type]
    );
    return res.rows[0];
  }

  async createForAdmins({ title, message, type = 'info' }) {
    // Finds all super_admin and admin users
    const admins = await db.query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('super_admin', 'admin') AND u.status = 'active'`
    );

    const inserted = [];
    for (const admin of admins.rows) {
      const item = await this.create({
        userId: admin.id,
        title,
        message,
        type,
      });
      inserted.push(item);
    }
    return inserted;
  }

  async findByUser(userId, limit = 20) {
    const res = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  async countUnread(userId) {
    const res = await db.query(
      `SELECT COUNT(*)::int AS unread_count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE AND deleted_at IS NULL`,
      [userId]
    );
    return res.rows[0]?.unread_count || 0;
  }

  async markAsRead(id, userId) {
    const res = await db.query(
      `UPDATE notifications
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return res.rows[0];
  }

  async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return true;
  }
}

module.exports = new NotificationRepository();
