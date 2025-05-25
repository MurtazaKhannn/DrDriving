const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', doctorController.register);
router.post('/login', doctorController.login);

// Protected routes
router.use(auth);
router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);

// Chat routes
router.post('/chats', doctorController.createChat);
router.get('/chats', doctorController.getChats);
router.get('/chats/:chatId', doctorController.getChat);
router.post('/chats/:chatId/message', doctorController.sendMessage);
router.put('/chats/:chatId/close', doctorController.closeChat);
router.post('/chats/:chatId/fix-messages', doctorController.fixMessages);

// Public doctor info route (must be after specific routes)
router.get('/:id', doctorController.getDoctorById);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 