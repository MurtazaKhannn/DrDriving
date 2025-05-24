const express = require('express');
const router = express.Router();
const medicalInfoController = require('../controllers/medicalInfoController');
const auth = require('../middleware/auth');

// Get all doctors (public route)
router.get('/doctors', medicalInfoController.getDoctors);

// Get doctor's appointments for a specific date (public route)
router.get('/doctor/:doctorId/date/:date', medicalInfoController.getDoctorAppointmentsByDate);

// Protected routes
router.use(auth);

// Create medical info/appointment
router.post('/', medicalInfoController.createMedicalInfo);

// Get doctor's appointments
router.get('/doctor/appointments', medicalInfoController.getDoctorAppointments);

// Get patient's appointments
router.get('/patient/appointments', medicalInfoController.getPatientAppointments);

// Update appointment status
router.patch('/:appointmentId/status', medicalInfoController.updateAppointmentStatus);

// Patient routes
router.get('/patient', medicalInfoController.getPatientMedicalInfo);

// Doctor routes
router.get('/doctor', medicalInfoController.getDoctorMedicalInfo);
router.put('/:id/status', medicalInfoController.updateStatus);

// Rate doctor after appointment
router.post('/appointment/:appointmentId/rate', medicalInfoController.rateDoctor);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 