const db = require('../src/db');

async function getDashboardStats(req, res) {
  try {
    const [[users]] = await db.query(
      'SELECT COUNT(*) AS total FROM users'
    );

    const [[services]] = await db.query(
      'SELECT COUNT(*) AS total FROM services'
    );

    const [[bookings]] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status = 'confirmed') AS confirmed,
        SUM(status = 'completed') AS completed,
        SUM(status = 'cancelled') AS cancelled
       FROM bookings`
    );

    return res.json({
      success: true,
      data: {
        totalUsers: Number(users.total) || 0,
        totalServices: Number(services.total) || 0,
        totalBookings: Number(bookings.total) || 0,
        pendingBookings: Number(bookings.pending) || 0,
        confirmedBookings: Number(bookings.confirmed) || 0,
        completedBookings: Number(bookings.completed) || 0,
        cancelledBookings: Number(bookings.cancelled) || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics.',
    });
  }
}

module.exports = {
  getDashboardStats,
};