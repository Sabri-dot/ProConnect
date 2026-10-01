
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const bookingController = require('../controllers/booking.controller');

// Client booking routes
router.get('/', verifyToken, bookingController.getMyBookings);

router.get(
  '/my-bookings',
  verifyToken,
  bookingController.getMyBookings
);

router.post('/', verifyToken, bookingController.createBooking);

module.exports = router;