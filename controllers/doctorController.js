const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Chat = require('../models/Chat');

// Doctor registration
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      specialty,
      qualifications,
      experience,
      phone,
      location,
      availability
    } = req.body;

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const doctor = new Doctor({
      email,
      passwordHash: password,
      name,
      specialty,
      qualifications,
      experience,
      phone,
      location,
      availability
    });

    await doctor.save();
    
    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ doctor, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Doctor login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    
    if (!doctor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await doctor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ doctor, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get doctor profile
exports.getProfile = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }
    const doctor = await Doctor.findById(req.user._id)
      .select('-passwordHash');
    res.json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update doctor profile
exports.updateProfile = async (req, res) => {
  if (req.userType !== 'doctor') {
    return res.status(403).json({ error: 'Access denied. Doctors only.' });
  }

  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'phone', 'location', 'availability', 'isAvailable'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get doctor's chats
exports.getChats = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const chats = await Chat.find({
      doctorId: req.user._id,
      status: 'active'
    })
    .sort({ lastMessage: -1 })
    .populate('patientId', 'name')
    .populate('messages.sender', 'name');

    res.json(chats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get specific chat
exports.getChat = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      doctorId: req.user._id
    })
    .populate('patientId', 'name')
    .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark unread messages as read
    chat.messages.forEach(message => {
      if (!message.isRead && message.sender._id.toString() !== req.user._id.toString()) {
        message.isRead = true;
      }
    });

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Send message in chat
exports.sendMessage = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { chatId, content } = req.body;
    const chat = await Chat.findOne({
      _id: chatId,
      doctorId: req.user._id,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages.push({
      sender: req.user._id,
      content,
      timestamp: new Date()
    });

    chat.lastMessage = new Date();
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Close chat
exports.closeChat = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      doctorId: req.user._id,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.status = 'closed';
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 