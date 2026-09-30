
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Please log in first.',
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Authentication is not configured.',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

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
    const [rows] = await db.query(
      'SELECT DATABASE() AS database_name'
    );

    res.json({
      success: true,
      message: 'MySQL connected successfully!',
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

// =========================
// REGISTER
// =========================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (
      typeof full_name !== 'string' ||
      !full_name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      password.length < 8 ||
      (phone != null && typeof phone !== 'string')
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, and a password of at least 8 characters are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        phone?.trim() || null,
        'client',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: result.insertId,
        full_name: full_name.trim(),
        email: normalizedEmail,
        role: 'client',
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    console.error('Register error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to register.',
    });
  }
});

// =========================
// LOGIN
// =========================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured.',
      });
    }

    const [users] = await db.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = users[0];

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Login failed.',
    });
  }
});

// =========================
// CATEGORIES API
// =========================

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Categories error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
    });
  }
});

// =========================
// SERVICES API
// =========================

app.get('/api/services', async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT
        s.id,
        s.title,
        s.description,
        s.price,
        s.duration_minutes,
        u.full_name AS professional_name,
        c.name AS category_name
      FROM services s
      JOIN users u ON s.professional_id = u.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Services error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch services.',
    });
  }
});

// CREATE SERVICE
app.post('/api/services', async (req, res) => {
  try {
    const {
      professional_id,
      category_id,
      title,
      description,
      price,
      duration_minutes,
    } = req.body;

    if (
      !professional_id ||
      !category_id ||
      typeof title !== 'string' ||
      !title.trim() ||
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(professional_id)) ||
      Number(professional_id) <= 0 ||
      !Number.isInteger(Number(category_id)) ||
      Number(category_id) <= 0 ||
      !Number.isInteger(Number(duration_minutes)) ||
      Number(duration_minutes) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing service fields.',
      });
    }

    const [professionals] = await db.query(
      `SELECT id FROM users
       WHERE id = ? AND role = 'professional'`,
      [professional_id]
    );

    if (professionals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Professional not found.',
      });
    }

    const [categories] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO services
       (professional_id, category_id, title, description,
        price, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        professional_id,
        category_id,
        title.trim(),
        description || null,
        Number(price),
        Number(duration_minutes),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully!',
      service_id: result.insertId,
    });
  } catch (error) {
    console.error('Create service error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to create service.',
    });
  }
});

// UPDATE SERVICE
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      title,
      description,
      price,
      duration_minutes,
    } = req.body;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0 ||
      !Number.isInteger(Number(category_id)) ||
      Number(category_id) <= 0 ||
      typeof title !== 'string' ||
      !title.trim() ||
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(duration_minutes)) ||
      Number(duration_minutes) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing service fields.',
      });
    }

    const [existing] = await db.query(
      'SELECT id FROM services WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const [categories] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }

    await db.query(
      `UPDATE services
       SET category_id = ?,
           title = ?,
           description = ?,
           price = ?,
           duration_minutes = ?
       WHERE id = ?`,
      [
        category_id,
        title.trim(),
        description || null,
        Number(price),
        Number(duration_minutes),
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Service updated successfully!',
    });
  } catch (error) {
    console.error('Update service error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to update service.',
    });
  }
});

// DELETE SERVICE
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
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

    res.json({
      success: true,
      message: 'Service deleted successfully!',
    });
  } catch (error) {
    console.error('Delete service error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to delete service.',
    });
  }
});

// =========================
// BOOKINGS API
// =========================

// GET BOOKINGS FOR LOGGED-IN CLIENT
app.get('/api/bookings', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can access these bookings.',
      });
    }

    const [bookings] = await db.query(
      `SELECT * FROM bookings
       WHERE client_id = ?
       ORDER BY booking_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings.',
    });
  }
});

// CREATE BOOKING FOR LOGGED-IN CLIENT
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { service_id, booking_date, notes } = req.body;
    const client_id = req.user.id;

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
        client_id,
        Number(service_id),
        booking_date,
        'pending',
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking_id: result.insertId,
    });
  } catch (error) {
    console.error('Create booking error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to create booking.',
    });
  }
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`ProConnect API running on port ${PORT}`);
});