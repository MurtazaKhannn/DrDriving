const mongoose = require('mongoose');

const medicalInfoSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  selectedSpecialty: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: {
    type: String,
    required: true,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: false
  },
  isPaymentDone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const MedicalInfo = mongoose.model('MedicalInfo', medicalInfoSchema);

module.exports = MedicalInfo; 