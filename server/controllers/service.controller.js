
const db = require('../src/db');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads/services');

function removeUploadedFiles(files = []) {
  for (const file of files) {
    fs.unlink(file.path, () => {});
  }
}

function removeStoredImages(images = []) {
  for (const image of images) {
    const filename = path.basename(image.image_url);
    const filePath = path.join(uploadDir, filename);
    fs.unlink(filePath, () => {});
  }
}

function imageUrl(file) {
  return `/uploads/services/${file.filename}`;
}

async function saveImages(serviceId, files = []) {
  if (!files.length) return;

  const values = files.map((file) => [serviceId, imageUrl(file)]);

  await db.query(
    'INSERT INTO service_images (service_id, image_url) VALUES ?',
    [values]
  );
}

async function isProfessional(userId) {
  const [users] = await db.query(
    'SELECT id FROM users WHERE id = ? AND role = ?',
    [userId, 'professional']
  );

  return users.length > 0;
}

function canManageService(user, service) {
  return user.role === 'admin' ||
    (user.role === 'professional' &&
      Number(user.id) === Number(service.professional_id));
}

// GET ALL SERVICES
exports.getServices = async (req, res) => {
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
        s.location,
        u.full_name AS professional_name,
        c.name AS category_name
      FROM services s
      LEFT JOIN users u ON u.id = s.professional_id
      LEFT JOIN categories c ON c.id = s.category_id
      ORDER BY s.created_at DESC
    `);

    if (services.length) {
      const ids = services.map((service) => service.id);
      const [images] = await db.query(
        'SELECT id, service_id, image_url FROM service_images WHERE service_id IN (?) ORDER BY id',
        [ids]
      );

      const imagesByService = {};
      for (const image of images) {
        if (!imagesByService[image.service_id]) {
          imagesByService[image.service_id] = [];
        }
        imagesByService[image.service_id].push(image);
      }

      for (const service of services) {
        service.images = imagesByService[service.id] || [];
      }
    }

    return res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not load services.',
    });
  }
};

// CREATE SERVICE
exports.createService = async (req, res) => {
  const files = req.files || [];

  try {
    const {
      category_id,
      title,
      description = '',
      price,
      duration_minutes = 60,
      location = '',
    } = req.body;

    if (!['professional', 'admin'].includes(req.user.role)) {
      removeUploadedFiles(files);
      return res.status(403).json({
        success: false,
        message: 'Only professionals can create services.',
      });
    }

    const professionalId = req.user.role === 'professional'
      ? req.user.id
      : req.body.professional_id;

    if (!professionalId || !category_id || !title ||
        price === undefined || price === '') {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Professional, category, title and price are required.',
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0 ||
        !Number.isInteger(Number(duration_minutes)) ||
        Number(duration_minutes) < 1) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Enter a valid price and duration.',
      });
    }

    if (title.trim().length > 150) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Title must be 150 characters or fewer.',
      });
    }

    if (!(await isProfessional(professionalId))) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Selected professional does not exist.',
      });
    }

    const [categories] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );

    if (!categories.length) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO services
        (professional_id, category_id, title, description,
         price, duration_minutes, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        professionalId,
        category_id,
        title.trim(),
        description.trim(),
        Number(price),
        Number(duration_minutes),
        location.trim(),
      ]
    );

    await saveImages(result.insertId, files);

    return res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: { id: result.insertId },
    });
  } catch (error) {
    removeUploadedFiles(files);
    console.error('Create service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not create service.',
    });
  }
};

// UPDATE SERVICE
exports.updateService = async (req, res) => {
  const files = req.files || [];

  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      removeUploadedFiles(files);
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const service = rows[0];

    if (!canManageService(req.user, service)) {
      removeUploadedFiles(files);
      return res.status(403).json({
        success: false,
        message: 'You cannot edit another professional’s service.',
      });
    }

    const categoryId = req.body.category_id ?? service.category_id;
    const title = req.body.title ?? service.title;
    const description = req.body.description ?? service.description ?? '';
    const price = req.body.price ?? service.price;
    const duration = req.body.duration_minutes ?? service.duration_minutes;
    const location = req.body.location ?? service.location ?? '';

    if (!String(title).trim() ||
        String(title).trim().length > 150 ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !Number.isInteger(Number(duration)) ||
        Number(duration) < 1) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Please check the title, price and duration.',
      });
    }

    const [categories] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (!categories.length) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist.',
      });
    }

    await db.query(
      `UPDATE services
       SET category_id = ?, title = ?, description = ?,
           price = ?, duration_minutes = ?, location = ?
       WHERE id = ?`,
      [
        categoryId,
        String(title).trim(),
        String(description).trim(),
        Number(price),
        Number(duration),
        String(location).trim(),
        id,
      ]
    );

    // If new images are supplied, replace the old set.
    // If no images are supplied, keep the existing images.
    if (files.length) {
      const [oldImages] = await db.query(
        'SELECT image_url FROM service_images WHERE service_id = ?',
        [id]
      );

      await db.query(
        'DELETE FROM service_images WHERE service_id = ?',
        [id]
      );

      await saveImages(id, files);
      removeStoredImages(oldImages);
    }

    return res.json({
      success: true,
      message: 'Service updated successfully.',
    });
  } catch (error) {
    removeUploadedFiles(files);
    console.error('Update service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not update service.',
    });
  }
};

// DELETE SERVICE
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    if (!canManageService(req.user, rows[0])) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete another professional’s service.',
      });
    }

    const [images] = await db.query(
      'SELECT image_url FROM service_images WHERE service_id = ?',
      [id]
    );

    await db.query('DELETE FROM services WHERE id = ?', [id]);
    removeStoredImages(images);

    return res.json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not delete service.',
    });
  }
};