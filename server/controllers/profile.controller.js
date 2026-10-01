const db = require('../src/db');


// GET LOGGED-IN USER PROFILE
async function getProfile(req, res) {
  try {
    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error('Get profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
}

// UPDATE LOGGED-IN USER PROFILE
async function updateProfile(req, res) {
  try {
    const { full_name, phone } = req.body;

    if (
      typeof full_name !== 'string' ||
      !full_name.trim() ||
      full_name.trim().length > 100 ||
      (phone != null &&
        (typeof phone !== 'string' || phone.trim().length > 30))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid name and phone number.',
      });
    }

    const [result] = await db.query(
      `UPDATE users
       SET full_name = ?, phone = ?
       WHERE id = ?`,
      [
        full_name.trim(),
        phone?.trim() || null,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      const [users] = await db.query(
        'SELECT id FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
    }

    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: users[0],
    });
  } catch (error) {
    console.error('Update profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};