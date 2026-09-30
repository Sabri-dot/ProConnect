const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProConnect API is running!',
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS database_name');

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
      !title?.trim() ||
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(professional_id)) ||
      !Number.isInteger(Number(category_id)) ||
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
app.listen(PORT, () => {
  console.log(`ProConnect API running on port ${PORT}`);
});