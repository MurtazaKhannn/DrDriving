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

    console.log('Received registration data:', {
      email,
      name,
      specialty,
      qualifications,
      experience,
      phone,
      location,
      availability
    });

    // Validate required fields
    if (!email || !password || !name || !specialty || !experience || !phone || !location) {
      console.log('Missing required fields:', {
        email: !email,
        password: !password,
        name: !name,
        specialty: !specialty,
        experience: !experience,
        phone: !phone,
        location: !location
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate location fields
    if (!location.city || !location.state || !location.country) {
      console.log('Invalid location data:', location);
      return res.status(400).json({ error: 'Invalid location data' });
    }

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
    
    // Remove passwordHash from the response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.passwordHash;
    
    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ doctor: doctorResponse, token });
  } catch (error) {
    console.error('Doctor registration error:', error);
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
    console.log('Chat ID:', chatId);
    console.log('Doctor ID:', req.user._id);

    const chat = await Chat.findOne({
      _id: chatId,
      doctorId: req.user._id
    })
    .populate('patientId', 'name')
    .populate('doctorId', 'name specialty')
    .populate('messages.sender', 'name');

    console.log('Found chat:', chat);

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
    console.error('Error in getChat:', error);
    res.status(400).json({ error: error.message });
  }
};

// Send message in chat
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;  // Get chatId from URL params
    const { content } = req.body;
    const doctorId = req.user._id;

    // First try to find chat without appointmentId
    let chat = await Chat.findOne({
      _id: chatId,
      doctorId,
      status: 'active'
    });

    // If not found, try with appointmentId if provided
    if (!chat && req.body.appointmentId) {
      chat = await Chat.findOne({
        _id: chatId,
        doctorId,
        appointmentId: req.body.appointmentId,
        status: 'active'
      });
    }

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Add new message
    chat.messages.push({
      sender: doctorId,
      senderType: 'doctor',
      content,
      timestamp: new Date()
    });

    chat.lastMessage = new Date();
    await chat.save();

    // Populate the updated chat with sender information
    const updatedChat = await Chat.findById(chat._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialty')
      .populate('messages.sender', 'name');

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Error in sendMessage:', error);
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

// Fix existing messages with null sender
exports.fixMessages = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      doctorId: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update messages with null sender
    chat.messages = chat.messages.map(message => {
      if (!message.sender) {
        return {
          ...message.toObject(),
          sender: req.user._id,
          senderType: 'doctor'
        };
      }
      return message;
    });

    await chat.save();

    // Get updated chat with populated sender information
    const updatedChat = await Chat.findById(chat._id)
      .populate('patientId', 'name')
      .populate({
        path: 'messages.sender',
        select: 'name',
        model: function() {
          return this.senderType === 'doctor' ? 'Doctor' : 'Patient';
        }
      });

    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('-passwordHash'); // Exclude password hash from response

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Error fetching doctor information' });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { patientId, appointmentId } = req.body;
    const doctorId = req.user._id;

    // Check if chat already exists
    let chat = await Chat.findOne({
      doctorId,
      patientId,
      appointmentId,
      status: 'active'
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    // Create new chat
    chat = new Chat({
      doctorId,
      patientId,
      appointmentId,
      messages: []
    });

    await chat.save();

    // Populate the chat with patient information
    const populatedChat = await Chat.findById(chat._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialty');

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error in createChat:', error);
    res.status(400).json({ error: error.message });
  }
}; 