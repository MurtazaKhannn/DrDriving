const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Chat = require('../models/Chat');

// Patient registration
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const patient = new Patient({
      email,
      passwordHash: password,
      name,
      phone,
      dateOfBirth,
      gender,
      address
    });

    await patient.save();
    
    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ patient, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Patient login
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
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }
    const patient = await Patient.findById(req.user._id)
      .select('-passwordHash');
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  if (req.userType !== 'patient') {
    return res.status(403).json({ error: 'Access denied. Patients only.' });
  }

  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'phone', 'address'];
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

// Get patient's chats
exports.getChats = async (req, res) => {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const chats = await Chat.find({
      patientId: req.user._id,
      status: 'active'
    })
    .sort({ lastMessage: -1 })
    .populate('doctorId', 'name specialty')
    .populate('messages.sender', 'name');

    res.json(chats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get specific chat
exports.getChat = async (req, res) => {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      patientId: req.user._id
    })
    .populate('doctorId', 'name specialty')
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

// Start new chat with doctor
exports.startChat = async (req, res) => {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const { doctorId, initialMessage } = req.body;

    const chat = new Chat({
      patientId: req.user._id,
      doctorId,
      status: 'active',
      messages: [{
        sender: req.user._id,
        content: initialMessage,
        timestamp: new Date()
      }],
      lastMessage: new Date()
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Send message in chat
exports.sendMessage = async (req, res) => {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const { chatId, content } = req.body;
    const chat = await Chat.findOne({
      _id: chatId,
      patientId: req.user._id,
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
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      patientId: req.user._id,
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