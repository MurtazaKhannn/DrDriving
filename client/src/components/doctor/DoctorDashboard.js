import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import axios from '../../utils/axios';

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    fetchDoctorDetails();
  }, []);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get('/doctor/profile');
      setDoctor(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="brand.light">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="lg">Doctor Dashboard</Heading>
            <Button
              colorScheme="blue"
              onClick={() => navigate('/doctor/appointments')}
              size="lg"
            >
              View My Appointments
            </Button>
          </HStack>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
            <GridItem>
              <Card bg={cardBg} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Profile Information</Heading>
                    {loading ? (
                      <Text>Loading profile...</Text>
                    ) : doctor ? (
                      <VStack align="start" spacing={2}>
                        <Text><strong>Name:</strong> Dr. {doctor.name}</Text>
                        <Text><strong>Email:</strong> {doctor.email}</Text>
                        <Text><strong>Specialty:</strong> {doctor.specialty}</Text>
                        <Text><strong>Experience:</strong> {doctor.experience} years</Text>
                        <Text><strong>Working Hours:</strong> {doctor.availability?.workingHours ? `${doctor.availability.workingHours.start} - ${doctor.availability.workingHours.end}` : 'Not specified'}</Text>
                        <Text><strong>Available Days:</strong> {doctor.availability?.daysAvailable ? doctor.availability.daysAvailable.join(', ') : 'Not specified'}</Text>
                        <Text><strong>Location:</strong> {doctor.location ? `${doctor.location.city}, ${doctor.location.state}, ${doctor.location.country}` : 'Not specified'}</Text>
                        <Text><strong>Phone:</strong> {doctor.phone || 'Not specified'}</Text>
                        <Box>
                          <Text fontWeight="bold">Qualifications:</Text>
                          {Array.isArray(doctor.qualifications) ? (
                            <VStack align="start" spacing={1} mt={1}>
                              {doctor.qualifications.map((qual, index) => (
                                <Text key={index}>
                                  • {qual.degree} from {qual.institution} ({qual.year})
                                </Text>
                              ))}
                            </VStack>
                          ) : (
                            <Text>{doctor.qualifications}</Text>
                          )}
                        </Box>
                      </VStack>
                    ) : (
                      <Text>No profile information available.</Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card bg={cardBg} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Quick Actions</Heading>
                    <Button
                      colorScheme="green"
                      onClick={() => navigate('/doctor/profile')}
                    >
                      Edit Profile
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default DoctorDashboard; 