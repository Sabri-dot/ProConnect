require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// GLOBAL MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

// =========================
// HEALTH CHECK
// =========================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProConnect API is running!',
  });
});

// =========================
// DATABASE TEST
// =========================

app.get('/api/db-test', async (req, res) => {
  try {
    const db = require('./db');

    const [rows] = await db.query(
      'SELECT DATABASE() AS database_name'
    );

    return res.json({
      success: true,
      message: 'MySQL connected successfully!',
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error('Database error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

// =========================
// API ROUTES
// =========================
app.use('/api/auth', require('../routes/auth.routes'));
app.use('/api/auth/profile', require('../routes/profile.routes'));
app.use('/api/categories', require('../routes/category.routes'));
app.use('/api/services', require('../routes/service.routes'));
app.use('/api/bookings', require('../routes/booking.routes'));
app.use('/api/admin', require('../routes/admin.routes'));

// =========================
// 404 - ROUTE NOT FOUND
// =========================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`ProConnect API running on port ${PORT}`);
});