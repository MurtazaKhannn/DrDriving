const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const auth = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Try to find user in both Patient and Doctor models
    const [patient, doctor] = await Promise.all([
      Patient.findOne({ _id: decoded.id }),
      Doctor.findOne({ _id: decoded.id })
    ]);

    if (!patient && !doctor) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request object
    if (patient) {
      req.user = patient;
      req.userType = 'patient';
    } else {
      req.user = doctor;
      req.userType = 'doctor';
    }

    // For backward compatibility
    if (req.userType === 'patient') {
      req.patient = req.user;
    } else {
      req.doctor = req.user;
    }

    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = auth; 