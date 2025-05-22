import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Grid,
  GridItem,
  Select,
  Divider,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const toast = useToast();
  const userType = localStorage.getItem('userType');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const endpoint = userType === 'doctor' ? '/doctor/profile' : '/profile';
      const response = await axios.get(endpoint);
      setUser(response.data);
      setFormData(response.data);
      setLoading(false);
      console.log('Profile data:', response.data);
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = userType === 'doctor' ? '/doctor/profile' : '/profile';
      
      // Only include allowed fields
      const allowedFields = ['name', 'phone', 'age', 'gender', 'location'];
      const formattedData = allowedFields.reduce((acc, field) => {
        if (field === 'location') {
          acc[field] = {
            city: formData.location?.city || '',
            state: formData.location?.state || '',
            country: formData.location?.country || ''
          };
        } else {
          acc[field] = formData[field];
        }
        return acc;
      }, {});

      console.log('Sending update with data:', formattedData);
      const response = await axios.put(endpoint, formattedData);
      setUser(response.data);
      console.log('Update response:', response.data);
      setEditing(false);
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="brand.light" py={10}>
        <Container maxW="container.md">
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="brand.light" py={10}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardBody p={8}>
              <VStack spacing={6} align="stretch">
                <Box textAlign="center">
                  <Avatar
                    size="2xl"
                    name={user?.name}
                    bg="brand.primary"
                    color="white"
                    mb={4}
                  />
                  <Heading size="lg" color="brand.primary">
                    {user?.name}
                  </Heading>
                  <Text color="gray.600">{userType === 'doctor' ? 'Medical Professional' : 'Patient'}</Text>
                </Box>

                <Divider />

                <form onSubmit={handleSubmit}>
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name || ''}
                          onChange={handleChange}
                          isDisabled={!editing}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email || ''}
                          isReadOnly
                          bg="gray.50"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleChange}
                          isDisabled={!editing}
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
                              value={formData.age || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              name="gender"
                              value={formData.gender || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
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
                            <FormLabel>City</FormLabel>
                            <Input
                              name="location.city"
                              value={formData.location?.city || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
                              placeholder="Enter your city"
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
                              isDisabled={!editing}
                              placeholder="Enter your state"
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
                              isDisabled={!editing}
                              placeholder="Enter your country"
                            />
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
                              value={formData.specialty || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Experience (years)</FormLabel>
                            <Input
                              name="experience"
                              type="number"
                              value={formData.experience || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Qualifications</FormLabel>
                            <Input
                              name="qualifications"
                              value={formData.qualifications || ''}
                              onChange={handleChange}
                              isDisabled={!editing}
                            />
                          </FormControl>
                        </GridItem>
                      </>
                    )}
                  </Grid>

                  <Box mt={6} textAlign="right">
                    {editing ? (
                      <>
                        <Button
                          variant="outline"
                          mr={3}
                          onClick={() => {
                            setEditing(false);
                            setFormData(user);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          colorScheme="blue"
                          isLoading={loading}
                        >
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        colorScheme="blue"
                        onClick={() => setEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                </form>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile; 