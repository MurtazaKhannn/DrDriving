# DrDriving - Healthcare Platform

A full-stack healthcare platform built with the MERN stack (MongoDB, Express.js, React, Node.js) that connects patients with doctors, facilitates appointments, and provides real-time communication.

## 🌟 Features

### 1. User Authentication
- Separate login/signup for doctors and patients
- JWT-based authentication
- Protected routes based on user type
- Secure password hashing with bcrypt

### 2. Doctor Features
- Profile management with qualifications and experience
- Appointment scheduling and management
- Real-time chat with patients
- Video consultation capability
- Rating and review system
- Availability management

### 3. Patient Features
- Doctor search and filtering
- Appointment booking
- Real-time chat with doctors
- Video consultation
- Medical history tracking
- Doctor rating and reviews
- Nearby hospital finder
- AI-powered symptom analysis and doctor recommendations

### 4. Real-time Communication
- Socket.IO-based chat system
- Real-time video consultations
- Typing indicators
- Message read status
- Chat history preservation

### 5. Appointment Management
- Appointment scheduling
- Status tracking (pending, confirmed, completed, cancelled)
- Payment tracking
- Appointment reminders
- Chat availability during appointment window

### 6. Location Services
- Find nearby hospitals
- Distance calculation using Haversine formula
- Hospital details including:
  - Name and address
  - Contact information
  - Emergency services
  - Operating hours

### 7. AI-Powered Healthcare Assistant
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
