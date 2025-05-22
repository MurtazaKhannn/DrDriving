const MedicalInfo = require('../models/MedicalInfo');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Get all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('name specialty');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching doctors' });
  }
};

// Create new medical info/appointment
exports.createMedicalInfo = async (req, res) => {
  try {
    const { doctorId, date, time, reason, symptoms } = req.body;
    const patientId = req.user._id;

    const medicalInfo = new MedicalInfo({
      patientId,
      doctorId,
      date,
      time,
      reason,
      symptoms
    });

    await medicalInfo.save();
    res.status(201).json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get patient's medical info/appointments
exports.getPatientMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialty')
      .sort({ date: -1 });
    res.json(medicalInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medical info' });
  }
};

// Get doctor's medical info/appointments
exports.getDoctorMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.find({ doctorId: req.user._id })
      .populate('patientId', 'name')
      .sort({ date: -1 });
    res.json(medicalInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medical info' });
  }
};

// Update medical info status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const medicalInfo = await MedicalInfo.findById(req.params.id);

    if (!medicalInfo) {
      return res.status(404).json({ error: 'Medical info not found' });
    }

    if (medicalInfo.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    medicalInfo.status = status;
    if (notes) medicalInfo.notes = notes;
    await medicalInfo.save();

    res.json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 