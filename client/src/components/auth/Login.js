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
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('patient');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = userType === 'doctor' ? '/doctor/login' : '/login';
      const response = await axios.post(endpoint, {
        email,
        password,
      });

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
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(`/${userType}/dashboard`);
    } catch (error) {
      console.error('Login error:', error);
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
      <Container maxW="container.md">
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
                  Welcome to DrDriving
                </Heading>
                <Text color="gray.600" mt={2}>
                  Your trusted healthcare platform
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
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

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      bg="white"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      bg="white"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={loading}
                    mt={4}
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>

              <Box textAlign="center">
                <Text color="gray.600">
                  Don't have an account?{' '}
                  <Button
                    variant="link"
                    color="brand.primary"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
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

export default Login; 