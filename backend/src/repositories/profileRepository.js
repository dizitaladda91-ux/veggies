const db = require('../database');

class ProfileRepository {
  async create({ userId, firstName, lastName, phone = null, company = null, bio = null, officialEmail = null }) {
    const res = await db.query(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, company, bio, official_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, firstName, lastName, phone, company, bio, officialEmail ? officialEmail.trim().toLowerCase() : null]
    );
    return res.rows[0];
  }

  async findByUserId(userId) {
    const res = await db.query(`SELECT * FROM profiles WHERE user_id = $1 AND deleted_at IS NULL`, [userId]);
    return res.rows[0] || null;
  }

  async update(userId, { firstName, lastName, phone, company, bio, avatarUrl, officialEmail, official_email }) {
    const targetOfficialEmail = (officialEmail || official_email || '').trim().toLowerCase() || null;
    const res = await db.query(
      `UPDATE profiles
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           company = COALESCE($4, company),
           bio = COALESCE($5, bio),
           avatar_url = COALESCE($6, avatar_url),
           official_email = COALESCE($7, official_email),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [firstName, lastName, phone, company, bio, avatarUrl, targetOfficialEmail, userId]
    );
    return res.rows[0];
  }
}

module.exports = new ProfileRepository();
