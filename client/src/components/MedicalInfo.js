import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';

const MedicalInfo = () => {
  const [formData, setFormData] = useState({
    selectedSpecialty: '',
    symptoms: '',
    appointmentDate: '',
    isPaymentDone: false
  });

  const [medicalInfo, setMedicalInfo] = useState([]);

  useEffect(() => {
    fetchMedicalInfo();
  }, []);

  const fetchMedicalInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/medical-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicalInfo(response.data);
    } catch (error) {
      console.error('Error fetching medical info:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isPaymentDone' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/medical-info', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMedicalInfo();
      setFormData({
        selectedSpecialty: '',
        symptoms: '',
        appointmentDate: '',
        isPaymentDone: false
      });
    } catch (error) {
      console.error('Error submitting medical info:', error);
    }
  };

  const specialties = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology'
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Medical Information
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            select
            label="Specialty"
            name="selectedSpecialty"
            value={formData.selectedSpecialty}
            onChange={handleChange}
            margin="normal"
            required
          >
            {specialties.map((specialty) => (
              <MenuItem key={specialty} value={specialty}>
                {specialty}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            label="Symptoms"
            name="symptoms"
            multiline
            rows={4}
            value={formData.symptoms}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Appointment Date"
            name="appointmentDate"
            type="datetime-local"
            value={formData.appointmentDate}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                name="isPaymentDone"
                checked={formData.isPaymentDone}
                onChange={handleChange}
              />
            }
            label="Payment Completed"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Submit
          </Button>
        </form>

        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Previous Records
        </Typography>
        
        {medicalInfo.map((info, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="subtitle1">
              Specialty: {info.selectedSpecialty}
            </Typography>
            <Typography variant="body2">
              Symptoms: {info.symptoms}
            </Typography>
            {info.appointmentDate && (
              <Typography variant="body2">
                Appointment: {new Date(info.appointmentDate).toLocaleString()}
              </Typography>
            )}
            <Typography variant="body2">
              Payment Status: {info.isPaymentDone ? 'Completed' : 'Pending'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default MedicalInfo; 