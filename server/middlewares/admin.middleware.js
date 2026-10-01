const db = require('../src/db');


async function verifyAdmin(req, res, next) {
  try {
    const [users] = await db.query(
      'SELECT id, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    req.user.role = users[0].role;
    next();
  } catch (error) {
    console.error('Admin authorization error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin permissions.',
    });
  }
}

module.exports = verifyAdmin;