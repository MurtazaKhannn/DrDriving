const Chat = require('../models/Chat');

exports.createChat = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patientId = req.patient._id;

    let chat = await Chat.findOne({
      patientId,
      doctorId,
      status: 'active'
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    // Create new chat
    chat = new Chat({
      patientId,
      doctorId,
      messages: []
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const patientId = req.patient._id;

    const chat = await Chat.findOne({
      _id: chatId,
      patientId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Add new message
    chat.messages.push({
      sender: patientId,
      content,
      timestamp: new Date()
    });

    chat.lastMessage = new Date();
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all chats for a patient
exports.getPatientChats = async (req, res) => {
  try {
    const patientId = req.patient._id;

    const chats = await Chat.find({
      patientId,
      status: 'active'
    })
    .sort({ lastMessage: -1 })
    .populate('doctorId', 'name specialty')
    .populate('messages.sender', 'name');

    res.status(200).json(chats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get specific chat with messages
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const patientId = req.patient._id;

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
    const patientId = req.patient._id;

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