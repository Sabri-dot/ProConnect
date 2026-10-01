
const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

router.get('/', verifyToken, profileController.getProfile);
router.put('/', verifyToken, profileController.updateProfile);

module.exports = router;