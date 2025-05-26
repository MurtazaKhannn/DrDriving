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
  Button,
  HStack,
  useColorModeValue,
  Input,
  IconButton,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import Navbar from '../common/Navbar';
import AppointmentForm from './AppointmentForm';
import HospitalSearch from '../common/HospitalSearch';
import axios from '../../utils/axios';
import axiosInstance from 'axios';

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.700');

  // Create a separate axios instance for chatbot API
  const chatbotAxios = axiosInstance.create({
    baseURL: 'https://dr-driving-ai.vercel.app',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/medical-info/doctors');
      setDoctors(response.data);
      // console.log(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { type: 'user', content: message };
    setMessage('');
    setIsChatLoading(true);

    try {
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        message: msg.content
      }));

      const response = await chatbotAxios.post('/api/chat', {
        message: userMessage.content,
        history: formattedHistory,
        userId: 'user123',
        doctors: doctors
      });

      // Only add messages after successful API call
      setChatHistory(prev => [
        ...prev,
        userMessage,
        { type: 'bot', content: response.data.message }
      ]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      // Add error message without duplicating user message
      setChatHistory(prev => [
        ...prev,
        { type: 'bot', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const displayedDoctors = showAllDoctors ? doctors : doctors.slice(0, 3);

  return (
    <Box minH="100vh" bg="brand.light">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="lg">Patient Dashboard</Heading>
            <Button
              colorScheme="blue"
              onClick={() => navigate('/patient/appointments')}
              size="lg"
            >
              View My Appointments
            </Button>
          </HStack>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
            <GridItem>
              <VStack spacing={4} align="stretch">
                <Card bg={cardBg} boxShadow="md">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Book an Appointment</Heading>
                      <AppointmentForm />
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} boxShadow="md">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Doctor Recommendation Assistant</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Describe your symptoms and I'll help you find the right doctor.
                      </Text>
                      
                      <Box 
                        height="300px" 
                        overflowY="auto" 
                        borderWidth={1} 
                        borderRadius="md" 
                        p={4}
                        bg={useColorModeValue('gray.50', 'gray.800')}
                      >
                        {chatHistory.map((msg, index) => (
                          <Box
                            key={index}
                            mb={2}
                            p={2}
                            borderRadius="md"
                            bg={msg.type === 'user' ? 'blue.100' : 'gray.100'}
                            alignSelf={msg.type === 'user' ? 'flex-end' : 'flex-start'}
                            maxW="80%"
                          >
                            <Text>{msg.content}</Text>
                          </Box>
                        ))}
                        {isChatLoading && (
                          <Flex justify="center" mt={2}>
                            <Spinner size="sm" />
                          </Flex>
                        )}
                      </Box>

                      <Flex>
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ask your health questions in any language..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <IconButton
                          ml={2}
                          colorScheme="blue"
                          icon={<FaPaperPlane />}
                          onClick={handleSendMessage}
                          isLoading={isChatLoading}
                        />
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack spacing={4} align="stretch">
                <Card bg={cardBg} boxShadow="md">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Available Doctors</Heading>
                      
                      {loading ? (
                        <Text>Loading doctors...</Text>
                      ) : doctors.length > 0 ? (
                        <SimpleGrid columns={1} spacing={4}>
                          {displayedDoctors.map(doctor => (
                            <Card key={doctor._id} variant="outline">
                              <CardBody>
                                <VStack align="start" spacing={2}>
                                  <Heading size="sm">Dr. {doctor.name}</Heading>
                                  <Text color="gray.600">Specialty: {doctor.specialty}</Text>
                                  <Text color="gray.600">Experience: {doctor.experience} years</Text>
                                  <Text color="gray.600"> {doctor.rating} Stars</Text>
                                  <Text color="gray.600"> {doctor.totalRatings} people rated this doctor</Text>
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
                          {doctors.length > 3 && (
                            <Button
                              onClick={() => setShowAllDoctors(!showAllDoctors)}
                              colorScheme="blue"
                              variant="outline"
                              width="100%"
                            >
                              {showAllDoctors ? 'Show Less' : `View More (${doctors.length - 3} more)`}
                            </Button>
                          )}
                        </SimpleGrid>
                      ) : (
                        <Text>No doctors available at the moment.</Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} boxShadow="md">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Find Nearby Hospitals</Heading>
                      <HospitalSearch />
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default PatientDashboard; 