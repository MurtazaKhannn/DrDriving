const Chat = require('../models/Chat');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.body;
    const patientId = req.user.id; // From auth middleware

    // Check if chat already exists for this appointment
    const existingChat = await Chat.findOne({ appointmentId });
    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = new Chat({
      patientId,
      doctorId,
      appointmentId,
      messages: []
    });

    await chat.save();

    // Populate user details
    const populatedChat = await Chat.findById(chat._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    console.log('Created new chat:', {
      chatId: chat._id,
      patientId,
      doctorId,
      appointmentId
    });

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Error creating chat' });
  }
};

// Get doctor's chats
exports.getDoctorChats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const chats = await Chat.find({ doctorId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error getting doctor chats:', error);
    res.status(500).json({ error: 'Error getting chats' });
  }
};

// Get patient's chats
exports.getPatientChats = async (req, res) => {
  try {
    const patientId = req.user.id;
    const chats = await Chat.find({ patientId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error getting patient chats:', error);
    res.status(500).json({ error: 'Error getting chats' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;
    const senderType = req.userType;

    console.log('Sending message:', {
      chatId,
      content,
      senderId,
      senderType
    });

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = {
      content,
      sender: senderId,
      senderType,
      timestamp: new Date()
    };

    chat.messages.push(message);
    await chat.save();

    // Populate sender details
    const populatedMessage = {
      ...message,
      sender: senderType === 'doctor' 
        ? await Doctor.findById(senderId).select('name email')
        : await Patient.findById(senderId).select('name email')
    };

    console.log('Message saved:', populatedMessage);

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
};

// Get chat messages
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat.messages);
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Error getting messages' });
  }
};

// Get specific chat with messages
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const patientId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      patientId
    })
    .populate('doctorId', 'name specialty')
    .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark unread messages as read
    chat.messages.forEach(message => {
      if (!message.isRead && message.sender._id.toString() !== patientId.toString()) {
        message.isRead = true;
      }
    });

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Close a chat
exports.closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const patientId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      patientId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.status = 'closed';
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 