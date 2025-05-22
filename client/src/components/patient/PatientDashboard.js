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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import Navbar from '../common/Navbar';
import AppointmentForm from './AppointmentForm';
import axios from '../../utils/axios';

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/medical-info/doctors');
      setDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="brand.light">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
          <GridItem>
            <AppointmentForm />
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Available Doctors</Heading>
                  
                  {loading ? (
                    <Text>Loading doctors...</Text>
                  ) : doctors.length > 0 ? (
                    <SimpleGrid columns={1} spacing={4}>
                      {doctors.map(doctor => (
                        <Card key={doctor._id} variant="outline">
                          <CardBody>
                            <VStack align="start" spacing={2}>
                              <Heading size="sm">Dr. {doctor.name}</Heading>
                              <Text color="gray.600">Specialty: {doctor.specialty}</Text>
                              <Text color="gray.600">Experience: {doctor.experience} years</Text>
                              <Box>
                                <Text color="gray.600" fontWeight="medium">Qualifications:</Text>
                                {Array.isArray(doctor.qualifications) ? (
                                  <VStack align="start" spacing={1} mt={1}>
                                    {doctor.qualifications.map((qual, index) => (
                                      <Text key={index} color="gray.600" fontSize="sm">
                                        • {qual.degree} from {qual.institution} ({qual.year})
                                      </Text>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text color="gray.600" fontSize="sm">
                                    {typeof doctor.qualifications === 'string' 
                                      ? doctor.qualifications 
                                      : 'No qualifications listed'}
                                  </Text>
                                )}
                              </Box>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text>No doctors available at the moment.</Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default PatientDashboard; 