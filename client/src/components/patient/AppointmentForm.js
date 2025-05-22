import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Text,
  Card,
  CardBody,
  Heading,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const AppointmentForm = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    symptoms: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/medical-info/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch doctors list',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/medical-info', formData);
      toast({
        title: 'Success',
        description: 'Medical info submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Reset form
      setFormData({
        doctorId: '',
        date: '',
        time: '',
        reason: '',
        symptoms: '',
      });
    } catch (error) {
      console.error('Error submitting medical info:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit medical info',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Heading size="md">Book an Appointment</Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Select Doctor</FormLabel>
                <Select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  placeholder="Choose a doctor"
                >
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Reason for Visit</FormLabel>
                <Textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please describe your reason for the appointment"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Symptoms</FormLabel>
                <Textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Please describe your symptoms"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={loading}
              >
                Book Appointment
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AppointmentForm; 