import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/appointments/doctor');
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch appointments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await axios.put(`/appointments/${appointmentId}`, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Appointment status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error updating appointment:', error);
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
      case 'pending':
        return 'yellow';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const renderAppointmentCard = (appointment) => (
    <Card key={appointment._id} mb={4}>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Box>
            <Heading size="sm">Patient: {appointment.patient.name}</Heading>
            <Text>Date: {new Date(appointment.date).toLocaleDateString()}</Text>
            <Text>Time: {appointment.time}</Text>
            <Text>Reason: {appointment.reason}</Text>
            <Text>Symptoms: {appointment.symptoms}</Text>
            <Badge colorScheme={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </Box>

          {appointment.status === 'pending' && (
            <Box>
              <Button
                colorScheme="green"
                size="sm"
                mr={2}
                onClick={() => handleStatusUpdate(appointment._id, 'accepted')}
              >
                Accept
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
              >
                Reject
              </Button>
            </Box>
          )}

          {appointment.status === 'accepted' && (
            <Button
              colorScheme="blue"
              size="sm"
              onClick={() => window.location.href = `/chat/${appointment.patient._id}`}
            >
              Start Chat
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const acceptedAppointments = appointments.filter(a => a.status === 'accepted');
  const rejectedAppointments = appointments.filter(a => a.status === 'rejected');

  return (
    <Box>
      <Heading size="lg" mb={6}>Appointments</Heading>
      
      <Tabs>
        <TabList>
          <Tab>Pending ({pendingAppointments.length})</Tab>
          <Tab>Accepted ({acceptedAppointments.length})</Tab>
          <Tab>Rejected ({rejectedAppointments.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack align="stretch">
              {pendingAppointments.map(renderAppointmentCard)}
            </VStack>
          </TabPanel>
          
          <TabPanel>
            <VStack align="stretch">
              {acceptedAppointments.map(renderAppointmentCard)}
            </VStack>
          </TabPanel>
          
          <TabPanel>
            <VStack align="stretch">
              {rejectedAppointments.map(renderAppointmentCard)}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AppointmentList; 