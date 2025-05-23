const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Chat routes
router.post('/', chatController.createChat);
router.post('/:chatId/message', chatController.sendMessage);
router.get('/', chatController.getPatientChats);
router.get('/:chatId', chatController.getChat);
router.put('/:chatId/close', chatController.closeChat);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router; 