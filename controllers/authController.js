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

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    // Check if user is a patient
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const patient = await Patient.findById(req.user._id)
      .select('-passwordHash'); // Exclude password from response

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    // Check if user is a patient
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const allowedUpdates = ['name', 'phone', 'age', 'gender', 'location'];
    const updates = Object.keys(req.body);
    
    // Check if all updates are allowed
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Update the patient
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    // Return updated patient without password
    const updatedPatient = await Patient.findById(req.user._id)
      .select('-passwordHash');
    
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
}; 