const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', doctorController.register);
router.get('/login', doctorController.login);

// Protected routes
router.use(auth);
router.get('/profile', doctorController.getProfile);
router.patch('/profile', doctorController.updateProfile);

// Chat routes
router.get('/chats', doctorController.getChats);
router.get('/chats/:chatId', doctorController.getChat);
router.post('/chats/:chatId/message', doctorController.sendMessage);
router.put('/chats/:chatId/close', doctorController.closeChat);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 