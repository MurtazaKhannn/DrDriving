import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Flex,
} from '@chakra-ui/react';

const AppointmentDetails = ({ appointment }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    return time;
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

  return (
    <Box p={4} borderWidth={1} borderRadius="lg">
      <VStack align="stretch" spacing={4}>
        <Flex justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">Appointment Details</Text>
          <Badge colorScheme={getStatusColor(appointment.status)} fontSize="md">
            {appointment.status.toUpperCase()}
          </Badge>
        </Flex>

        <Divider />

        {/* Patient Information */}
        <Box>
          <Text fontWeight="bold" mb={2}>Patient Information</Text>
          <Text>Name: {appointment.patientId?.name}</Text>
          <Text>Reason: {appointment.reason}</Text>
          <Text>Symptoms: {appointment.symptoms}</Text>
        </Box>

        <Divider />

        {/* Appointment Time */}
        <Box>
          <Text fontWeight="bold" mb={2}>Appointment Time</Text>
          <Text>Date: {formatDate(appointment.date)}</Text>
          <Text>Time: {formatTime(appointment.time)}</Text>
        </Box>

        <Divider />

        {/* Payment Information */}
        <Box>
          <Text fontWeight="bold" mb={2}>Payment Information</Text>
          <Flex justify="space-between" align="center" mb={2}>
            <Text>Amount:</Text>
            <Text fontWeight="bold">${appointment.payment?.amount || 0}</Text>
          </Flex>
          <Flex justify="space-between" align="center" mb={2}>
            <Text>Status:</Text>
            <Badge colorScheme={getPaymentStatusColor(appointment.payment?.status)}>
              {appointment.payment?.status?.toUpperCase() || 'PENDING'}
            </Badge>
          </Flex>
          {appointment.payment?.stripePaymentId && (
            <Text fontSize="sm" color="gray.500">
              Payment ID: {appointment.payment.stripePaymentId}
            </Text>
          )}
        </Box>

        {/* Payment Status Alert */}
        {appointment.payment?.status === 'completed' ? (
          <Alert status="success">
            <AlertIcon />
            Payment has been completed successfully
          </Alert>
        ) : appointment.payment?.status === 'failed' ? (
          <Alert status="error">
            <AlertIcon />
            Payment has failed. Please contact the patient.
          </Alert>
        ) : (
          <Alert status="warning">
            <AlertIcon />
            Payment is pending
          </Alert>
        )}

        {/* Notes */}
        {appointment.notes && (
          <>
            <Divider />
            <Box>
              <Text fontWeight="bold" mb={2}>Notes</Text>
              <Text>{appointment.notes}</Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default AppointmentDetails; 