# DrDriving - Healthcare Platform

A full-stack healthcare platform built with the MERN stack (MongoDB, Express.js, React, Node.js) that connects patients with doctors, facilitates appointments, and provides real-time communication.

## 🌟 Features

### 1. User Authentication : https://www.loom.com/share/ed2b120889814f7396d9b85007aa432b?sid=7cdc423a-5d83-4260-8575-50892bf12ab4
- Separate login/signup for doctors and patients
- JWT-based authentication
- Protected routes based on user type
- Secure password hashing with bcrypt

### 2. Doctor & Patient Features 
- Profile management for doctors (qualifications, experience, availability) 
- Doctor search with filters for patients 
- Appointment scheduling, booking, and management 
- Real-time chat and video consultations between doctors and patients 
- Medical history tracking for patients 
- Rating and review system for both parties 
- Nearby hospital finder powered by AI 

### 3. Real-time Chat Features : https://www.loom.com/share/f088898969a34fc1b87c323ee44aa788?sid=6223bc71-3363-404e-831c-43b7c722914c
- Socket.IO-based real-time chat
- Typing indicators
- Message read status
- Chat history preservation

### 4. Real-time Video Consultation : https://www.loom.com/share/72ec5b420aca40fc92304757e7ba4ec7
- Secure video calls between doctors and patients
- Seamless integration with appointment system

### 5. Appointment Management : https://www.loom.com/share/bb9482d727ea4047a7006bb2241dc39c?sid=a235d51f-4010-4a5e-8705-d7f26aa6d34f
- Appointment scheduling
- Status tracking (pending, confirmed, completed, cancelled)
- Payment tracking
- Appointment reminders
- Chat availability during appointment window

### 6. Location Services : https://www.loom.com/share/9ac09c7556414546be1aa614f402496e?sid=0f337247-c016-4576-bfb2-3ea80661d57a
- Find nearby hospitals
- Distance calculation using Haversine formula
- Hospital details including:
  - Name and address
  - Contact information
  - Emergency services
  - Operating hours

### 7. AI-Powered Healthcare Assistant : https://www.loom.com/share/9ac09c7556414546be1aa614f402496e?sid=0f337247-c016-4576-bfb2-3ea80661d57a
- Multilingual chatbot support
- Symptom-based doctor recommendations
- Natural language processing for medical queries
- Intelligent doctor matching based on:
  - Patient symptoms
  - Doctor specialization
  - Doctor experience
  - Patient history
- Real-time language detection and response
- Contextual medical advice
- Appointment scheduling assistance

## 🛠️ Technology Stack

### Frontend
- React.js
- Chakra UI for styling
- React Router for navigation
- Socket.IO client for real-time features
- Axios for API calls
- WebRTC for video calls
- Natural Language Processing for chatbot

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- bcrypt for password hashing
- CORS for cross-origin requests
- AI/ML models for symptom analysis
- Language detection and translation services

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dr-driving
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

4. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Running the Application

1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- CORS configuration
- Input validation
- Error handling
- Secure socket connections

## 📱 Real-time Features

### Chat System
- Real-time messaging
- Typing indicators
- Message read status
- Chat history
- File sharing capability

### Video Consultation
- WebRTC-based video calls
- Appointment-based access
- Secure peer-to-peer connection
- Quality controls

## 🏥 Hospital Search

- Uses OpenStreetMap API
- Haversine formula for distance calculation
- Filters by:
  - Distance
  - Emergency services
  - Operating hours
- Shows detailed hospital information

## 🔄 Deployment

The application is deployed on:
- Frontend: Render
- Backend: Render
- Database: MongoDB Atlas

## 📝 API Documentation

### Authentication
- POST `/api/login` - User login
- POST `/api/signup` - User registration
- POST `/api/doctor/register` - Doctor registration

### Appointments
- GET `/api/medical-info/appointments` - Get appointments
- POST `/api/medical-info/appointments` - Create appointment
- PATCH `/api/medical-info/appointments/:id` - Update appointment

### Chat
- GET `/api/chat/:id` - Get chat history
- POST `/api/chat/:id/message` - Send message
- GET `/api/chat/rooms` - Get chat rooms

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
