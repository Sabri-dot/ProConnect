const db = require('../src/db');


// GET ALL SERVICES
async function getServices(req, res) {
  try {
    const [services] = await db.query(`
      SELECT
        s.id,
        s.title,
        s.description,
        s.price,
        s.duration_minutes,
        s.professional_id,
        s.category_id,
        u.full_name AS professional_name,
        c.name AS category_name
      FROM services s
      JOIN users u ON s.professional_id = u.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
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

// CREATE SERVICE
async function createService(req, res) {
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
      !Number.isInteger(Number(professional_id)) ||
      Number(professional_id) <= 0 ||
      !Number.isInteger(Number(category_id)) ||
      Number(category_id) <= 0 ||
      typeof title !== 'string' ||
      !title.trim() ||
      !Number.isFinite(Number(price)) ||
      price === '' ||
      Number(price) < 0 ||
      !Number.isInteger(Number(duration_minutes)) ||
      Number(duration_minutes) <= 0 ||
      (description != null && typeof description !== 'string')
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
        Number(professional_id),
        Number(category_id),
        title.trim(),
        description?.trim() || null,
        Number(price),
        Number(duration_minutes),
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Service created successfully!',
      service_id: result.insertId,
    });
  } catch (error) {
    console.error('Create service error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create service.',
    });
  }
}

// UPDATE SERVICE
async function updateService(req, res) {
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
      price === '' ||
      price == null ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(duration_minutes)) ||
      Number(duration_minutes) <= 0 ||
      (description != null && typeof description !== 'string')
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
        Number(category_id),
        title.trim(),
        description?.trim() || null,
        Number(price),
        Number(duration_minutes),
        Number(id),
      ]
    );

    return res.json({
      success: true,
      message: 'Service updated successfully!',
    });
  } catch (error) {
    console.error('Update service error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update service.',
    });
  }
}

// DELETE SERVICE
async function deleteService(req, res) {
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
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Service deleted successfully!',
    });
  } catch (error) {
    console.error('Delete service error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete service.',
    });
  }
}

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
};