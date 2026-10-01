
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/admin.middleware');

const adminController = require('../controllers/admin.controller');
const bookingController = require('../controllers/booking.controller');

router.use(verifyToken, verifyAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/bookings', bookingController.getAllBookings);

router.patch(
  '/bookings/:id/status',
  bookingController.updateBookingStatus
);

module.exports = router;