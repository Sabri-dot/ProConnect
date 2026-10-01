
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const serviceController = require('../controllers/service.controller');
const uploadServiceImages = require('../middlewares/service-upload.middleware');

// Public: list all services
router.get('/', serviceController.getServices);

// Authenticated: create a service with up to 5 images
router.post(
  '/',
  verifyToken,
  uploadServiceImages,
  serviceController.createService
);

// Authenticated: owner or admin can update
router.put(
  '/:id',
  verifyToken,
  uploadServiceImages,
  serviceController.updateService
);

// Authenticated: owner or admin can delete
router.delete(
  '/:id',
  verifyToken,
  serviceController.deleteService
);

module.exports = router;