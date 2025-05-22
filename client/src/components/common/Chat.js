import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  useToast,
  Avatar,
  Heading,
} from '@chakra-ui/react';
import axios from '../../utils/axios';

const Chat = ({ recipientId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    fetchMessages();
    fetchRecipientInfo();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [recipientId]);

  const fetchRecipientInfo = async () => {
    try {
      const endpoint = userType === 'doctor' ? `/patients/${recipientId}` : `/doctors/${recipientId}`;
      const response = await axios.get(endpoint);
      setRecipient(response.data);
    } catch (error) {
      console.error('Error fetching recipient info:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/messages/${recipientId}`);
      setMessages(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('/messages', {
        recipientId,
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Text>Loading chat...</Text>;
  }

  return (
    <Box h="100vh" p={4}>
      <VStack h="full" spacing={4}>
        {/* Chat Header */}
        <Flex w="full" align="center" p={4} borderBottom="1px" borderColor="gray.200">
          <Avatar name={recipient?.name} mr={4} />
          <Heading size="md">
            {userType === 'doctor' ? 'Patient' : 'Dr.'} {recipient?.name}
          </Heading>
        </Flex>

        {/* Messages */}
        <Box
          flex={1}
          w="full"
          overflowY="auto"
          p={4}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.200',
              borderRadius: '24px',
            },
          }}
        >
          <VStack spacing={4} align="stretch">
            {messages.map((message) => (
              <Flex
                key={message._id}
                justify={message.sender === userType ? 'flex-end' : 'flex-start'}
              >
                <Box
                  maxW="70%"
                  bg={message.sender === userType ? 'blue.500' : 'gray.100'}
                  color={message.sender === userType ? 'white' : 'black'}
                  p={3}
                  borderRadius="lg"
                >
                  <Text>{message.content}</Text>
                  <Text fontSize="xs" mt={1} opacity={0.7}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Message Input */}
        <form onSubmit={handleSend} style={{ width: '100%' }}>
          <Flex>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              mr={2}
            />
            <Button type="submit" colorScheme="blue">
              Send
            </Button>
          </Flex>
        </form>
      </VStack>
    </Box>
  );
};

export default Chat; 