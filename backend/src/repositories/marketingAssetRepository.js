const db = require('../database');

class MarketingAssetRepository {
  async ensureTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS marketing_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(150) NOT NULL,
          asset_type VARCHAR(50) DEFAULT 'BANNER',
          image_url TEXT NOT NULL,
          dimensions VARCHAR(50) DEFAULT '728x90',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {}
  }

  async findAll() {
    await this.ensureTable();
    const { rows } = await db.query(
      `SELECT * FROM marketing_assets ORDER BY created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    await this.ensureTable();
    const { rows } = await db.query(
      `SELECT * FROM marketing_assets WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ title, assetType, imageUrl, dimensions, description }) {
    await this.ensureTable();
    const { rows } = await db.query(
      `INSERT INTO marketing_assets (title, asset_type, image_url, dimensions, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, assetType || 'BANNER', imageUrl, dimensions || '728x90', description]
    );
    return rows[0];
  }

  async delete(id) {
    await this.ensureTable();
    const { rows } = await db.query(
      `DELETE FROM marketing_assets WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new MarketingAssetRepository();
