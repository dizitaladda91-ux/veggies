const db = require('../database');

class MarketingAssetRepository {
  async findAll() {
    const { rows } = await db.query(
      `SELECT * FROM marketing_assets ORDER BY created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await db.query(
      `SELECT * FROM marketing_assets WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ title, assetType, imageUrl, dimensions, description }) {
    const { rows } = await db.query(
      `INSERT INTO marketing_assets (title, asset_type, image_url, dimensions, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, assetType || 'BANNER', imageUrl, dimensions || '728x90', description]
    );
    return rows[0];
  }

  async delete(id) {
    const { rows } = await db.query(
      `DELETE FROM marketing_assets WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new MarketingAssetRepository();
