const db = require('../database');

class UserRepository {
  async findByEmail(email) {
    const res = await db.query(
      `SELECT u.*, r.name as role_name, p.official_email
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (LOWER(u.email) = $1 OR LOWER(p.official_email) = $1) AND u.deleted_at IS NULL`,
      [email.toLowerCase()]
    );
    return res.rows[0] || null;
  }

  async findByOfficialEmail(officialEmail) {
    const res = await db.query(
      `SELECT u.*, r.name as role_name, p.official_email, p.first_name, p.last_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN profiles p ON p.user_id = u.id
       WHERE LOWER(p.official_email) = $1 AND u.deleted_at IS NULL`,
      [officialEmail.toLowerCase()]
    );
    return res.rows[0] || null;
  }

  async findById(id) {
    const res = await db.query(
      `SELECT u.id, u.email, u.status, u.is_email_verified, u.parent_affiliate_id, u.created_at, u.updated_at,
              r.name as role_name, r.id as role_id,
              p.first_name, p.last_name, p.phone, p.company, p.avatar_url, p.bio, p.official_email
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async create({ email, passwordHash, roleId, status = 'active', parentAffiliateId = null }) {
    const res = await db.query(
      `INSERT INTO users (email, password_hash, role_id, status, parent_affiliate_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, status, role_id, created_at`,
      [email.toLowerCase(), passwordHash, roleId, status, parentAffiliateId]
    );
    return res.rows[0];
  }

  async updateRefreshToken(userId, refreshToken) {
    await db.query(
      `UPDATE users SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [refreshToken, userId]
    );
  }

  async updateEmail(userId, email) {
    const res = await db.query(
      `UPDATE users SET email = $1, is_email_verified = FALSE,
       email_verification_token_hash = NULL, email_verification_expires_at = NULL,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, email, is_email_verified`,
      [email.toLowerCase(), userId]
    );
    return res.rows[0] || null;
  }

  async updatePassword(userId, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL`,
      [passwordHash, userId]
    );
  }

  async savePasswordReset(userId, tokenHash, expiresAt) { await db.query('UPDATE users SET password_reset_token_hash=$1, password_reset_expires_at=$2 WHERE id=$3', [tokenHash, expiresAt, userId]); }
  async findByPasswordResetToken(tokenHash) { const res = await db.query(`SELECT u.*, p.first_name, p.official_email FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.password_reset_token_hash=$1 AND u.password_reset_expires_at > CURRENT_TIMESTAMP AND u.deleted_at IS NULL`, [tokenHash]); return res.rows[0] || null; }
  async clearPasswordReset(userId) { await db.query('UPDATE users SET password_reset_token_hash=NULL, password_reset_expires_at=NULL, refresh_token=NULL WHERE id=$1', [userId]); }
  async savePasswordResetToken(userId, tokenHash, expiresAt) { return this.savePasswordReset(userId, tokenHash, expiresAt); }
  async findPasswordResetToken(tokenHash) { return this.findByPasswordResetToken(tokenHash); }
  async deletePasswordResetToken(userId) { return this.clearPasswordReset(userId); }

  async saveEmailVerification(userId, tokenHash, expiresAt) {
    await db.query('UPDATE users SET email_verification_token_hash=$1, email_verification_expires_at=$2 WHERE id=$3', [tokenHash, expiresAt, userId]);
  }
  async saveEmailVerificationToken(userId, tokenHash, expiresAt) {
    return this.saveEmailVerification(userId, tokenHash, expiresAt);
  }

  async findByEmailVerificationToken(tokenHash) {
    const res = await db.query(
      `SELECT u.id, u.email, u.is_email_verified, p.official_email 
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email_verification_token_hash=$1 AND u.email_verification_expires_at > CURRENT_TIMESTAMP AND u.deleted_at IS NULL`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }
  async findEmailVerificationToken(tokenHash) { return this.findByEmailVerificationToken(tokenHash); }

  async findSessionUserById(id) {
    const res = await db.query(
      `SELECT u.id, u.email, u.status, u.refresh_token, u.mfa_enabled, u.mfa_secret_encrypted, r.name AS role_name, p.official_email
       FROM users u 
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }
  async enableMfa(userId, encryptedSecret) { await db.query('UPDATE users SET mfa_enabled=TRUE, mfa_secret_encrypted=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [encryptedSecret, userId]); }

  async verifyEmail(userId) {
    await db.query(
      `UPDATE users SET is_email_verified=TRUE, email_verification_token_hash=NULL,
       email_verification_expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [userId]
    );
  }
  async markEmailVerified(userId) { return this.verifyEmail(userId); }
  async deleteEmailVerificationToken(userId) {
    await db.query(
      'UPDATE users SET email_verification_token_hash=NULL, email_verification_expires_at=NULL WHERE id=$1',
      [userId]
    );
  }

  async updateStatus(userId, status) {
    const res = await db.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING id, status`,
      [status, userId]
    );
    return res.rows[0];
  }

  async softDelete(userId) {
    await db.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );
  }

  async findAll({ page = 1, limit = 10, role = null, status = null, search = '' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClauses = ['u.deleted_at IS NULL'];

    if (role) {
      params.push(role);
      whereClauses.push(`r.name = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`u.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClauses.push(`(LOWER(u.email) LIKE $${params.length} OR LOWER(p.official_email) LIKE $${params.length} OR LOWER(p.first_name) LIKE $${params.length} OR LOWER(p.last_name) LIKE $${params.length})`);
    }

    const whereStr = whereClauses.join(' AND ');

    const countRes = await db.query(
      `SELECT COUNT(u.id) FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN profiles p ON p.user_id = u.id WHERE ${whereStr}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataRes = await db.query(
      `SELECT u.id, u.email, u.status, u.is_email_verified, u.created_at,
              r.name as role_name,
              p.first_name, p.last_name, p.company, p.official_email
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE ${whereStr}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      users: dataRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRoleByName(roleName) {
    const res = await db.query(`SELECT id, name FROM roles WHERE name = $1 AND deleted_at IS NULL`, [roleName]);
    return res.rows[0] || null;
  }
}

module.exports = new UserRepository();
