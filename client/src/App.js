import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PatientDashboard from './components/patient/PatientDashboard';
import PatientAppointments from './components/patient/PatientAppointments';
import Profile from './components/common/Profile';
import DoctorAppointments from './components/doctor/DoctorAppointments';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <SocketProvider>
        <Box minH="100vh" bg="brand.light">
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Patient Routes */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedUserTypes={['patient']}>
                    <PatientAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Protected Profile Routes */}
              <Route
                path="/doctor/profile"
                element={
                  <ProtectedRoute allowedUserTypes={['doctor']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedUserTypes={['patient']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Appointments Route */}
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedUserTypes={['doctor']}>
                    <DoctorAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </Box>
      </SocketProvider>
    </ChakraProvider>
  );
}

export default App;
