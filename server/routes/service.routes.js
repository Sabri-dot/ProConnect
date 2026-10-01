
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/admin.middleware');
const serviceController = require('../controllers/service.controller');

router.get('/', serviceController.getServices);

router.post(
  '/',
  verifyToken,
  verifyAdmin,
  serviceController.createService
);

router.put(
  '/:id',
  verifyToken,
  verifyAdmin,
  serviceController.updateService
);

router.delete(
  '/:id',
  verifyToken,
  verifyAdmin,
  serviceController.deleteService
);

module.exports = router;