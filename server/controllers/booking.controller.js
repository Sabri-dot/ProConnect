const db = require('../src/db');


// GET BOOKINGS FOR LOGGED-IN CLIENT
async function getMyBookings(req, res) {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can access these bookings.',
      });
    }

    const [bookings] = await db.query(
      `SELECT
        b.*,
        s.title AS service_title
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.client_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings.',
    });
  }
}

// CREATE BOOKING
async function createBooking(req, res) {
  try {
    const { service_id, booking_date, notes } = req.body;

    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can create bookings.',
      });
    }

    if (
      !Number.isInteger(Number(service_id)) ||
      Number(service_id) <= 0 ||
      !booking_date
    ) {
      return res.status(400).json({
        success: false,
        message: 'Service and booking date are required.',
      });
    }

    const date = new Date(booking_date);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid future booking date.',
      });
    }

    if (notes != null && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Notes must be text.',
      });
    }

    const [services] = await db.query(
      'SELECT id FROM services WHERE id = ?',
      [service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO bookings
       (client_id, service_id, booking_date, status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        Number(service_id),
        booking_date,
        'pending',
        notes?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking_id: result.insertId,
    });
  } catch (error) {
    console.error('Create booking error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create booking.',
    });
  }
}

// GET ALL BOOKINGS - ADMIN ONLY
async function getAllBookings(req, res) {
  try {
    const [bookings] = await db.query(`
      SELECT
        b.*,
        s.title AS service_title,
        c.full_name AS client_name,
        c.email AS client_email
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users c ON b.client_id = c.id
      ORDER BY b.booking_date DESC
    `);

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get all bookings error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all bookings.',
    });
  }
}

// UPDATE BOOKING STATUS - ADMIN ONLY
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

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
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
      [status, id]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query(
        'SELECT id FROM bookings WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found.',
        });
      }
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

module.exports = {
  getMyBookings,
  createBooking,
  getAllBookings,
  updateBookingStatus,
};