require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

// Import routes
const authRoutes = require('./routes/authRoutes');
const medicalInfoRoutes = require('./routes/medicalInfoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 120000,
  pingInterval: 25000,
  connectTimeout: 45000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  path: '/socket.io',
  allowEIO3: true,
  upgrade: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userType = socket.handshake.auth.userType;

    if (!token || !userType) {
      console.error('Missing token or userType in socket handshake');
      return next(new Error('Authentication error: Missing credentials'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check both Patient and Doctor models
    const [patient, doctor] = await Promise.all([
      Patient.findById(decoded.id),
      Doctor.findById(decoded.id)
    ]);

    if (!patient && !doctor) {
      console.error('User not found in database');
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = decoded.id;
    socket.userType = userType;
    console.log('Socket authenticated:', socket.userId, socket.userType);
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error: ' + err.message));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId, 'Type:', socket.userType);

  // Handle socket connection
  socket.on('connect', () => {
    // Remove this handler as it's redundant with the connection event
  });

  // Handle chat room joining
  socket.on('join_chat', async (data) => {
    try {
      const { chatId } = data;
      
      // Check if user is already in the room
      const isInRoom = socket.rooms?.has(chatId);
      
      if (!isInRoom) {
        // Leave any existing chat rooms
        socket.rooms?.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Join the new chat room
        await socket.join(chatId);
        
        // Verify room membership
        const rooms = Array.from(socket.rooms || []);
        
        // Notify other users in the room
        socket.to(chatId).emit('user_joined', {
          userId: socket.userId,
          userType: socket.userType,
          timestamp: new Date().toISOString()
        });

        // Send confirmation to the user
        socket.emit('room_joined', {
          chatId,
          rooms,
          timestamp: new Date().toISOString()
        });
      } else {
        // Send confirmation to the user
        socket.emit('room_joined', {
          chatId,
          rooms: Array.from(socket.rooms || []),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Handle message sending
  socket.on('send_message', async (data) => {
    try {
      const { chatId, message } = data;

      // Create message object with sender info
      const messageWithSender = {
        ...message,
        sender: socket.userId,
        senderType: socket.userType,
        timestamp: new Date().toISOString(),
        _id: message._id || `temp_${Date.now()}`
      };

      // Get all sockets in the room
      const roomSockets = await io.in(chatId).fetchSockets();

      // Broadcast to ALL users in the chat room (including sender)
      io.in(chatId).emit('new_message', { 
        message: messageWithSender
      });

      // Send confirmation back to sender
      socket.emit('message_sent', { 
        message: messageWithSender
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { chatId } = data;
    socket.to(chatId).emit('user_typing', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('stop_typing', (data) => {
    const { chatId } = data;
    socket.to(chatId).emit('user_stop_typing', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle ping
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
    
    // Get all rooms the socket was in
    const rooms = Array.from(socket.rooms || []);
    
    // Notify each room about the disconnection
    rooms.forEach(room => {
      if (room !== socket.id) {
        io.to(room).emit('user_disconnected', {
          userId: socket.id,
          reason,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/medical-info', medicalInfoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor', doctorRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dr-driving', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 