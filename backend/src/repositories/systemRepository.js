const db = require('../database');

class SystemRepository {
  async getSetting(key) {
    const res = await db.query(`SELECT * FROM system_settings WHERE key = $1 AND deleted_at IS NULL`, [key]);
    return res.rows[0] ? res.rows[0].value : null;
  }

  async setSetting(key, value, description = null, updatedBy = null) {
    const res = await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE
       SET value = $2, description = COALESCE($3, system_settings.description), updated_by = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, JSON.stringify(value), description, updatedBy]
    );
    return res.rows[0];
  }

  async getAllSettings() {
    const res = await db.query(`SELECT key, value, description, updated_at FROM system_settings WHERE deleted_at IS NULL`);
    return res.rows;
  }
}

module.exports = new SystemRepository();
