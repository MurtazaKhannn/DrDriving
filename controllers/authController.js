const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { email, password, name, age, gender, phone, location } = req.body;
    
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const patient = new Patient({
      email,
      passwordHash: password,
      name,
      age,
      gender,
      phone,
      location
    });

    await patient.save();
    
    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ patient, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ email });
    
    if (!patient) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ patient, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 