const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

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

    // Find patient
    const patient = await Patient.findOne({ _id: decoded.id });
    if (!patient) {
      return res.status(401).json({ error: 'Patient not found' });
    }
    
    // Attach patient to request object
    req.patient = patient;
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