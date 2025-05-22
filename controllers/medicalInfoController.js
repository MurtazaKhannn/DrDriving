const MedicalInfo = require('../models/MedicalInfo');

// Create medical info
exports.createMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = new MedicalInfo({
      ...req.body,
      patientId: req.patient._id
    });
    await medicalInfo.save();
    res.status(201).json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get medical info
exports.getMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.find({ patientId: req.patient._id });
    res.json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 