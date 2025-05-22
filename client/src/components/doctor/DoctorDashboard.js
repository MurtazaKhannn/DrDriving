import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import Navbar from '../common/Navbar';
import AppointmentList from './AppointmentList';

const DoctorDashboard = () => {
  return (
    <Box minH="100vh" bg="brand.light">
      <Navbar />
      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading color="brand.primary">Doctor Dashboard</Heading>
            <Text color="gray.600">Welcome to your healthcare dashboard</Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Patients</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>Active consultations</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Today's Appointments</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>Scheduled for today</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Messages</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>Unread messages</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          <AppointmentList />
        </VStack>
      </Container>
    </Box>
  );
};

export default DoctorDashboard; 