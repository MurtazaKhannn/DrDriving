const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['doctor', 'patient'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
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
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  lastMessage: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a pre-find middleware to handle population
chatSchema.pre('find', function() {
  this.populate('patientId', 'name')
      .populate('doctorId', 'name specialty')
      .populate('messages.sender', 'name');
});

chatSchema.pre('findOne', function() {
  this.populate('patientId', 'name')
      .populate('doctorId', 'name specialty')
      .populate('messages.sender', 'name');
});

// Index for faster queries
chatSchema.index({ patientId: 1, doctorId: 1 });
chatSchema.index({ lastMessage: -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 