const express = require('express');
const router = express.Router();
const medicalInfoController = require('../controllers/medicalInfoController');
const auth = require('../middleware/auth');

router.post('/', auth, medicalInfoController.createMedicalInfo);
router.get('/', auth, medicalInfoController.getMedicalInfo);

module.exports = router; 