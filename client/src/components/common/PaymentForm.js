import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  VStack,
  useToast,
  Text,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const PaymentForm = ({ appointmentId, amount, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    try {
      // Create payment intent
      const { data: { clientSecret } } = await axios.post('medical-info/create-payment-intent', {
        appointmentId
      });

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        toast({
          title: 'Payment Failed',
          description: stripeError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await axios.post('medical-info/confirm-payment', {
          appointmentId,
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: 'Payment Successful',
          description: 'Your appointment has been confirmed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onPaymentSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <Box width="100%" p={4} borderWidth={1} borderRadius="md">
          <Text mb={2}>Amount to Pay: ${amount}</Text>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </Box>
        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={loading}
          isDisabled={!stripe}
        >
          Pay Now
        </Button>
      </VStack>
    </form>
  );
};

export default PaymentForm; 