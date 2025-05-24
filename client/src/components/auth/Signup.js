import React, { useState, useEffect } from 'react';
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
  HStack,
  Checkbox,
} from '@chakra-ui/react';
import axios from '../../utils/axios';
import { AddIcon } from '@chakra-ui/icons';

const Signup = () => {
  const [userType, setUserType] = useState('patient');
  const initialDoctorState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    qualifications: [{
      degree: '',
      institution: '',
      year: ''
    }],
    experience: '',
    location: {
      city: '',
      state: '',
      country: ''
    },
    availability: {
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      daysAvailable: []
    }
  };

  const initialPatientState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    location: {
      city: '',
      state: '',
      country: ''
    }
  };

  const [formData, setFormData] = useState(initialPatientState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Reset form when user type changes
  useEffect(() => {
    setFormData(userType === 'doctor' ? initialDoctorState : initialPatientState);
  }, [userType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields (e.g., location.city)
    if (name.includes('.')) {
      const parts = name.split('.');
      
      // Handle qualifications fields
      if (parts[0] === 'qualifications') {
        const [_, index, field] = parts;
        setFormData(prev => ({
          ...prev,
          qualifications: prev.qualifications.map((qual, i) => 
            i === parseInt(index) ? { ...qual, [field]: value } : qual
          )
        }));
      } 
      // Handle location fields
      else if (parts[0] === 'location') {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
      // Handle availability fields
      else if (parts[0] === 'availability') {
        const [parent, child, subChild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        { degree: '', institution: '', year: '' }
      ]
    }));
  };

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleAvailabilityChange = (day, isChecked) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        daysAvailable: isChecked
          ? [...(prev.availability?.daysAvailable || []), day]
          : (prev.availability?.daysAvailable || []).filter(d => d !== day)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = userType === 'doctor' ? '/doctor/register' : '/signup';
      
      // Format the data based on user type
      const requestData = userType === 'doctor' 
        ? {
            ...formData,
            // Ensure location is properly structured
            location: {
              city: formData.location.city,
              state: formData.location.state,
              country: formData.location.country
            },
            // Ensure availability is properly structured
            availability: {
              workingHours: {
                start: formData.availability.workingHours.start,
                end: formData.availability.workingHours.end
              },
              daysAvailable: formData.availability.daysAvailable
            }
          }
        : formData;

      console.log('Sending registration data:', requestData);

      // Validate required fields for doctor
      if (userType === 'doctor') {
        const requiredFields = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          specialty: formData.specialty,
          experience: formData.experience,
          phone: formData.phone,
          'location.city': formData.location.city,
          'location.state': formData.location.state,
          'location.country': formData.location.country
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }

      const response = await axios.post(endpoint, requestData);
      
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
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
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

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>City</FormLabel>
                            <Input
                              name="location.city"
                              value={formData.location?.city || ''}
                              onChange={handleChange}
                              placeholder="Enter your city"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>State</FormLabel>
                            <Input
                              name="location.state"
                              value={formData.location?.state || ''}
                              onChange={handleChange}
                              placeholder="Enter your state"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Country</FormLabel>
                            <Input
                              name="location.country"
                              value={formData.location?.country || ''}
                              onChange={handleChange}
                              placeholder="Enter your country"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>
                      </>
                    ) : (
                      <>
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Specialty</FormLabel>
                            <Select
                              name="specialty"
                              value={formData.specialty}
                              onChange={handleChange}
                              bg="white"
                            >
                              <option value="">Select specialty</option>
                              <option value="Cardiology">Cardiology</option>
                              <option value="Dermatology">Dermatology</option>
                              <option value="Neurology">Neurology</option>
                              <option value="Orthopedics">Orthopedics</option>
                              <option value="Pediatrics">Pediatrics</option>
                              <option value="Psychiatry">Psychiatry</option>
                              <option value="Gynecology">Gynecology</option>
                              <option value="Ophthalmology">Ophthalmology</option>
                            </Select>
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
                              min="0"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem colSpan={2}>
                          <FormControl isRequired>
                            <FormLabel>Qualifications</FormLabel>
                            <VStack spacing={4} align="stretch">
                              {userType === 'doctor' && Array.isArray(formData.qualifications) && formData.qualifications.map((qual, index) => (
                                <HStack key={index} spacing={4}>
                                  <Input
                                    name={`qualifications.${index}.degree`}
                                    value={qual.degree}
                                    onChange={handleChange}
                                    placeholder="Degree"
                                    bg="white"
                                  />
                                  <Input
                                    name={`qualifications.${index}.institution`}
                                    value={qual.institution}
                                    onChange={handleChange}
                                    placeholder="Institution"
                                    bg="white"
                                  />
                                  <Input
                                    name={`qualifications.${index}.year`}
                                    value={qual.year}
                                    onChange={handleChange}
                                    placeholder="Year"
                                    type="number"
                                    bg="white"
                                  />
                                  {index > 0 && (
                                    <Button
                                      colorScheme="red"
                                      size="sm"
                                      onClick={() => removeQualification(index)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </HStack>
                              ))}
                              <Button
                                colorScheme="blue"
                                size="sm"
                                onClick={addQualification}
                                leftIcon={<AddIcon />}
                              >
                                Add Qualification
                              </Button>
                            </VStack>
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>City</FormLabel>
                            <Input
                              name="location.city"
                              value={formData.location?.city || ''}
                              onChange={handleChange}
                              placeholder="Enter your city"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>State</FormLabel>
                            <Input
                              name="location.state"
                              value={formData.location?.state || ''}
                              onChange={handleChange}
                              placeholder="Enter your state"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Country</FormLabel>
                            <Input
                              name="location.country"
                              value={formData.location?.country || ''}
                              onChange={handleChange}
                              placeholder="Enter your country"
                              bg="white"
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem colSpan={2}>
                          <FormControl isRequired>
                            <FormLabel>Working Hours</FormLabel>
                            <HStack spacing={4}>
                              <FormControl>
                                <FormLabel>Start Time</FormLabel>
                                <Input
                                  type="time"
                                  name="availability.workingHours.start"
                                  value={formData.availability?.workingHours?.start || '09:00'}
                                  onChange={handleChange}
                                  bg="white"
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel>End Time</FormLabel>
                                <Input
                                  type="time"
                                  name="availability.workingHours.end"
                                  value={formData.availability?.workingHours?.end || '23:00'}
                                  onChange={handleChange}
                                  bg="white"
                                />
                              </FormControl>
                            </HStack>
                          </FormControl>
                        </GridItem>

                        <GridItem colSpan={2}>
                          <FormControl isRequired>
                            <FormLabel>Available Days</FormLabel>
                            <HStack spacing={4} wrap="wrap">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <Checkbox
                                  key={day}
                                  isChecked={formData.availability?.daysAvailable?.includes(day)}
                                  onChange={(e) => handleAvailabilityChange(day, e.target.checked)}
                                >
                                  {day}
                                </Checkbox>
                              ))}
                            </HStack>
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