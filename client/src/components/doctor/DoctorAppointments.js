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
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from '../../utils/axios';
import AppointmentChat from '../common/AppointmentChat';
import { useNavigate } from 'react-router-dom';

const DoctorAppointments = () => {
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
      const response = await axios.get('/medical-info/doctor/appointments');
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

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`/medical-info/${appointmentId}/status`, { status: newStatus });
      
      // If appointment is confirmed, open chat window
      if (newStatus === 'confirmed') {
        const appointment = appointments.find(apt => apt._id === appointmentId);
        setSelectedAppointment(appointment);
        onOpen();
      }

      toast({
        title: 'Success',
        description: `Appointment ${newStatus} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchAppointments(); // Refresh the appointments list
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
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
            onClick={() => navigate('/doctor/dashboard')}
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
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold">Patient: {appointment.patientId.name}</Text>
                    </Box>
                    <Badge colorScheme={getStatusColor(appointment.status)}>
                      {appointment.status.toUpperCase()}
                    </Badge>
                  </Flex>
                  
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

                  {/* Payment Information */}
                  <Box mt={2}>
                    <Text fontWeight="bold">Payment Status:</Text>
                    <Flex justify="space-between" align="center" mt={1}>
                      <Badge colorScheme={getPaymentStatusColor(appointment.payment?.status)}>
                        {appointment.payment?.status?.toUpperCase() || 'PENDING'}
                      </Badge>
                      <Text fontWeight="bold">
                        ${appointment.payment?.amount || 0}
                      </Text>
                    </Flex>
                    {appointment.payment?.status === 'completed' ? (
                      <Alert status="success" mt={2} size="sm">
                        <AlertIcon />
                        Payment completed successfully
                      </Alert>
                    ) : appointment.payment?.status === 'failed' ? (
                      <Alert status="error" mt={2} size="sm">
                        <AlertIcon />
                        Payment failed
                      </Alert>
                    ) : (
                      <Alert status="warning" mt={2} size="sm">
                        <AlertIcon />
                        Payment pending
                      </Alert>
                    )}
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
                    
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <>
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
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        >
                          Mark as Completed
                        </Button>
                      </>
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

export default DoctorAppointments; 