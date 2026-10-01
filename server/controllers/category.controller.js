const db = require('../src/db');

async function getCategories(req, res) {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Categories error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
    });
  }
}

module.exports = {
  getCategories,
};