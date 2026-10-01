
const db = require('../src/db');

// DASHBOARD STATISTICS
async function getDashboardStats(req, res) {
  try {
    const [[users]] = await db.query(
      'SELECT COUNT(*) AS total FROM users'
    );

    const [[services]] = await db.query(
      'SELECT COUNT(*) AS total FROM services'
    );

    const [[bookings]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status = 'confirmed') AS confirmed,
        SUM(status = 'completed') AS completed,
        SUM(status = 'cancelled') AS cancelled
      FROM bookings
    `);

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

// GET ALL BOOKINGS
async function getAllBookings(req, res) {
  try {
    const [bookings] = await db.query(`
      SELECT
        b.*,
        s.title AS service_title,
        u.full_name AS client_name,
        u.email AS client_email
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.id DESC
    `);

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings.',
    });
  }
}

// UPDATE BOOKING STATUS
async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'pending',
      'confirmed',
      'completed',
      'cancelled',
    ];

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID.',
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status.',
      });
    }

    const [result] = await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Booking status updated successfully.',
    });
  } catch (error) {
    console.error('Update booking status error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status.',
    });
  }
}

// GET ALL USERS
async function getAllUsers(req, res) {
  try {
    const [users] = await db.query(`
      SELECT id, full_name, email, phone, role
      FROM users
      ORDER BY id DESC
    `);

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
}

// DELETE USER
async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    // Do not allow deleting admin accounts.
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? AND role <> 'admin'",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or cannot be deleted.',
      });
    }

    return res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'User has related records and cannot be deleted.',
      });
    }

    console.error('Delete user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
    });
  }
}

// GET ALL SERVICES
async function getAllServices(req, res) {
  try {
    const [services] = await db.query(`
      SELECT
        s.id,
        s.professional_id,
        s.category_id,
        s.title,
        s.description,
        s.price,
        s.duration
      FROM services s
      ORDER BY s.id DESC
    `);

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch services.',
    });
  }
}

// DELETE SERVICE
async function deleteService(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID.',
      });
    }

    const [result] = await db.query(
      'DELETE FROM services WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Service has related bookings and cannot be deleted.',
      });
    }

    console.error('Delete service error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete service.',
    });
  }
}

module.exports = {
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  getAllUsers,
  deleteUser,
  getAllServices,
  deleteService,
};