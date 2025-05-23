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
import { useNavigate } from 'react-router-dom';

const AppointmentForm = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    symptoms: '',
    notes: ''
  });
  const toast = useToast();
  const navigate = useNavigate();

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

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setFormData(prev => ({ ...prev, doctorId }));
    
    try {
      const response = await axios.get(`/doctor/${doctorId}`);
      console.log(response.data);
      setSelectedDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    }
  };

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour] = startTime.split(':');
    const [endHour] = endTime.split(':');

    let startHourNum = parseInt(startHour);
    let endHourNum = parseInt(endHour);

    // Handle overnight shifts (e.g., 22:00 - 10:00)
    if (startHourNum > endHourNum) {
      // Generate slots from start time to 23:30
      for (let hour = startHourNum; hour <= 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 23) {
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
      // Generate slots from 00:00 to end time
      for (let hour = 0; hour <= endHourNum; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < endHourNum) {
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
    } else {
      // Normal working hours (e.g., 09:00 - 17:00)
      for (let hour = startHourNum; hour <= endHourNum; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < endHourNum) {
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
    }

    console.log('Generated time slots:', slots);
    return slots;
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setFormData(prev => ({ ...prev, date: selectedDate }));

    if (selectedDate && selectedDoctor) {
      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!selectedDoctor.availability.daysAvailable.includes(dayOfWeek)) {
        toast({
          title: 'Not Available',
          description: 'Doctor is not available on this day',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setAvailableTimeSlots([]);
        return;
      }

      // Generate time slots based on doctor's working hours
      const slots = generateTimeSlots(
        selectedDoctor.availability.workingHours.start,
        selectedDoctor.availability.workingHours.end
      );

      // Check which slots are already booked
      try {
        const response = await axios.get(`/medical-info/doctor/${selectedDoctor._id}/date/${selectedDate}`);
        const bookedSlots = response.data.map(apt => apt.time);
        const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));
        setAvailableTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        setAvailableTimeSlots(slots);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/medical-info', formData);
      toast({
        title: 'Success',
        description: 'Appointment request sent successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/patient/appointments');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to book appointment',
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
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
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
                  value={formData.date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Time</FormLabel>
                <Select
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="Select time"
                  isDisabled={!formData.date || availableTimeSlots.length === 0}
                >
                  {availableTimeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Select>
                {formData.date && availableTimeSlots.length === 0 && (
                  <Text color="red.500" fontSize="sm">
                    No available time slots for this date
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Reason for Visit</FormLabel>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please describe your reason for the appointment"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Symptoms</FormLabel>
                <Textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Please describe your symptoms"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information you'd like to share"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={loading}
                isDisabled={!formData.doctorId || !formData.date || !formData.time || !formData.reason || !formData.symptoms}
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