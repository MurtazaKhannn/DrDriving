import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';
import axios from '../../utils/axios';

const DoctorRating = ({ appointmentId, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/medical-info/appointment/${appointmentId}/rate`, {
        rating: Number(rating)
      });

      if (onRatingSubmit) {
        onRatingSubmit(response.data);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit rating';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="bold">Rate your experience with the doctor:</Text>
      <HStack spacing={2}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            as={FaStar}
            w={8}
            h={8}
            color={star <= (hover || rating) ? 'yellow.400' : 'gray.300'}
            cursor="pointer"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          />
        ))}
      </HStack>
      <Button
        colorScheme="blue"
        onClick={handleRatingSubmit}
        isLoading={isSubmitting}
        loadingText="Submitting..."
        isDisabled={rating === 0}
      >
        Submit Rating
      </Button>
    </VStack>
  );
};

export default DoctorRating; 