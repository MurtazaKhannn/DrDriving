const express = require('express');
const router = express.Router();
const medicalInfoController = require('../controllers/medicalInfoController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes in this router
router.use(auth);

// Protected routes
router.post('/', medicalInfoController.createMedicalInfo);
router.get('/', medicalInfoController.getMedicalInfo);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 