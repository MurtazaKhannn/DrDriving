const mongoose = require('mongoose');

const medicalInfoSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  // Payment related fields
  payment: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'usd'
    },
    stripePaymentId: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    isPaymentDone: {
      type: Boolean,
      default: false
    }
  },
  hasRated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const MedicalInfo = mongoose.model('MedicalInfo', medicalInfoSchema);

module.exports = MedicalInfo; 