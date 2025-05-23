import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner,
  Center,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
} from '@chakra-ui/react';
import axios from '../../utils/axios';
import AppointmentChat from '../common/AppointmentChat';
import { useNavigate } from 'react-router-dom';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/medical-info/patient/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch appointments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentStatus = (appointment) => {
    // Show notification based on appointment status
    if (appointment.status === 'cancelled') {
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled by the doctor.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (appointment.status === 'confirmed') {
      toast({
        title: 'Appointment Confirmed',
        description: 'Your appointment has been confirmed. You can now chat with your doctor.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'confirmed':
        return 'green';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center" w="100%">
          <Heading size="lg">My Appointments</Heading>
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => navigate('/patient/dashboard')}
            leftIcon={<span>←</span>}
          >
            Back to Dashboard
          </Button>
        </Flex>
        
        {appointments.length === 0 ? (
          <Text>No appointments found.</Text>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Box>
                    <Text fontWeight="bold">Doctor: Dr. {appointment.doctorId.name}</Text>
                    <Text>Specialty: {appointment.doctorId.specialty}</Text>
                  </Box>
                  
                  <Box>
                    <Text>
                      Date: {new Date(appointment.date).toLocaleDateString()}
                    </Text>
                    <Text>Time: {appointment.time}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Reason:</Text>
                    <Text>{appointment.reason}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Symptoms:</Text>
                    <Text>{appointment.symptoms}</Text>
                  </Box>
                  
                  {appointment.notes && (
                    <Box>
                      <Text fontWeight="bold">Notes:</Text>
                      <Text>{appointment.notes}</Text>
                    </Box>
                  )}
                  
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={getStatusColor(appointment.status)}
                      alignSelf="flex-start"
                    >
                      {appointment.status.toUpperCase()}
                    </Badge>
                    
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          onOpen();
                        }}
                      >
                        Open Chat
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

      {/* Chat Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Appointment Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAppointment && (
              <AppointmentChat
                appointmentId={selectedAppointment._id}
                doctorId={selectedAppointment.doctorId._id}
                patientId={selectedAppointment.patientId._id}
                appointmentTime={selectedAppointment.time}
                appointmentDate={selectedAppointment.date}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PatientAppointments; 