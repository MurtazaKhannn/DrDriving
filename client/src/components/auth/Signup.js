import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Image,
  Select,
  Card,
  CardBody,
  useColorModeValue,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const Signup = () => {
  const [userType, setUserType] = useState('patient');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    // Doctor specific fields
    specialty: '',
    qualifications: '',
    experience: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = userType === 'doctor' ? '/doctor/register' : '/register';
      const response = await axios.post(endpoint, formData);
      
      // Check if response has the expected data structure
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }

      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', userType);

      // Store user data based on userType
      const userData = userType === 'doctor' ? response.data.doctor : response.data.patient;
      if (!userData) {
        throw new Error('User data not found in response');
      }

      localStorage.setItem('user', JSON.stringify(userData));

      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(`/${userType}/dashboard`);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="brand.light" py={10}>
      <Container maxW="container.lg">
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody p={8}>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Image
                  src="/medical-logo.svg"
                  alt="Medical Logo"
                  boxSize="120px"
                  mx="auto"
                  mb={4}
                />
                <Heading color="brand.primary" size="xl">
                  Create Your Account
                </Heading>
                <Text color="gray.600" mt={2}>
                  Join our healthcare community
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      bg="white"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                    </Select>
                  </FormControl>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          bg="white"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          bg="white"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password"
                          bg="white"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          bg="white"
                        />
                      </FormControl>
                    </GridItem>

                    {userType === 'patient' ? (
                      <>
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Age</FormLabel>
                            <Input
                              name="age"
                              type="number"
                              value={formData.age}
                              onChange={handleChange}
                              placeholder="Enter your age"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              name="gender"
                              value={formData.gender}
                              onChange={handleChange}
                              bg="white"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </Select>
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Blood Group</FormLabel>
                            <Select
                              name="bloodGroup"
                              value={formData.bloodGroup}
                              onChange={handleChange}
                              bg="white"
                            >
                              <option value="">Select blood group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </Select>
                          </FormControl>
                        </GridItem>
                      </>
                    ) : (
                      <>
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Specialty</FormLabel>
                            <Input
                              name="specialty"
                              value={formData.specialty}
                              onChange={handleChange}
                              placeholder="Enter your specialty"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Experience (years)</FormLabel>
                            <Input
                              name="experience"
                              type="number"
                              value={formData.experience}
                              onChange={handleChange}
                              placeholder="Years of experience"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Qualifications</FormLabel>
                            <Input
                              name="qualifications"
                              value={formData.qualifications}
                              onChange={handleChange}
                              placeholder="Enter your qualifications"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>
                      </>
                    )}

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Address</FormLabel>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter your address"
                          bg="white"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={loading}
                    mt={4}
                  >
                    Create Account
                  </Button>
                </VStack>
              </form>

              <Box textAlign="center">
                <Text color="gray.600">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    color="brand.primary"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default Signup; 