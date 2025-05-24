import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  Flex,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import AppointmentDetails from './AppointmentDetails';

const AppointmentList = ({ appointments, onStatusUpdate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAppointment, setSelectedAppointment] = React.useState(null);

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    onOpen();
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
    <Box>
      <VStack spacing={4} align="stretch">
        {appointments.map((appointment) => (
          <Box
            key={appointment._id}
            p={4}
            borderWidth={1}
            borderRadius="lg"
            cursor="pointer"
            onClick={() => handleAppointmentClick(appointment)}
            _hover={{ bg: 'gray.50' }}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="bold">
                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
              </Text>
              <Badge colorScheme={getStatusColor(appointment.status)}>
                {appointment.status.toUpperCase()}
              </Badge>
            </Flex>

            <Text mb={2}>Patient: {appointment.patientId?.name}</Text>
            <Text mb={2}>Reason: {appointment.reason}</Text>

            <Flex justify="space-between" align="center">
              <Badge colorScheme={getPaymentStatusColor(appointment.payment?.status)}>
                Payment: {appointment.payment?.status?.toUpperCase() || 'PENDING'}
              </Badge>
              <Text fontWeight="bold">
                ${appointment.payment?.amount || 0}
              </Text>
            </Flex>

            {appointment.status === 'pending' && (
              <Flex mt={4} gap={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(appointment._id, 'confirmed');
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(appointment._id, 'cancelled');
                  }}
                >
                  Cancel
                </Button>
              </Flex>
            )}
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Appointment Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAppointment && (
              <AppointmentDetails appointment={selectedAppointment} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AppointmentList; 