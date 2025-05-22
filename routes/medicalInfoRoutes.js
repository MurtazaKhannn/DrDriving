const express = require('express');
const router = express.Router();
const medicalInfoController = require('../controllers/medicalInfoController');
const auth = require('../middleware/auth');

// Get all doctors (public route)
router.get('/doctors', medicalInfoController.getDoctors);

// Patient routes
router.post('/', auth, medicalInfoController.createMedicalInfo);
router.get('/patient', auth, medicalInfoController.getPatientMedicalInfo);

// Doctor routes
router.get('/doctor', auth, medicalInfoController.getDoctorMedicalInfo);
router.put('/:id/status', auth, medicalInfoController.updateStatus);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 