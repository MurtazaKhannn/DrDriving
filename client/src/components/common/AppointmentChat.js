import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  Flex,
  Avatar,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from '../../utils/axios';
import { useSocket } from '../../contexts/SocketContext';

const AppointmentChat = ({ appointmentId, doctorId, patientId, appointmentTime, appointmentDate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isWithinAppointmentTime, setIsWithinAppointmentTime] = useState(false);
  const [isAppointmentOver, setIsAppointmentOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isInRoom, setIsInRoom] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const { socket, isConnected, joinChat, leaveChat, sendMessage, sendTypingStatus } = useSocket();
  const typingTimeoutRef = useRef(null);
  const userType = localStorage.getItem('userType');
  const [chat, setChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const pendingMessagesRef = useRef(new Set());
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const refreshIntervalRef = useRef(null);

  const checkAppointmentTime = () => {
    const now = new Date();
    const appointmentDateTime = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

    // Set appointment window (30 minutes before and 30 minutes after)
    const startTime = new Date(appointmentDateTime.getTime() - 30 * 60000);
    const endTime = new Date(appointmentDateTime.getTime() + 30 * 60000);

    const isWithin = now >= startTime && now <= endTime;
    const isOver = now > endTime;

    setIsWithinAppointmentTime(isWithin);
    setIsAppointmentOver(isOver);
  };

  useEffect(() => {
    checkAppointmentTime();
    const interval = setInterval(checkAppointmentTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [appointmentDate, appointmentTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize chat when component mounts
  useEffect(() => {
    if (appointmentId) {
      initializeChat();
    }
  }, [appointmentId]); // Re-initialize when appointmentId changes

  // Set up socket listeners when chat is initialized
  useEffect(() => {
    if (!chat?._id || !socket) {
      console.log('Socket or chat not initialized:', { chatId: chat?._id, socket: !!socket });
      return;
    }

    console.log('Setting up socket listeners for chat:', chat._id, 'User type:', userType);
    
    // Join chat room immediately if socket is connected
    if (socket.connected) {
      console.log('Socket connected, joining chat room:', chat._id);
      joinChat(chat._id);
    }

    // Listen for room joined confirmation
    const handleRoomJoined = (data) => {
      const { rooms } = data;
      const isInChatRoom = rooms.includes(chat._id);
      setIsInRoom(isInChatRoom);
      if (isInChatRoom) {
        console.log('Successfully joined chat room:', {
          chatId: chat._id,
          userType,
          rooms
        });
      } else {
        console.warn('Failed to join chat room:', {
          chatId: chat._id,
          userType,
          rooms
        });
      }
    };

    // Listen for new messages
    const handleNewMessage = (data) => {
      const { message } = data;
      
      if (!message || !message.content) {
        console.warn('Received invalid message:', message);
        return;
      }

      // Create a unique message identifier
      const messageKey = `${message._id}_${message.timestamp}`;
      
      // Check if we've already processed this message
      if (pendingMessagesRef.current.has(messageKey)) {
        pendingMessagesRef.current.delete(messageKey);
        return;
      }

      // Ensure message has proper sender information
      const messageWithSender = {
        ...message,
        sender: message.sender?._id || message.sender,
        senderType: message.senderType || userType,
        content: message.content || message.message || '',
        timestamp: message.timestamp || new Date().toISOString()
      };

      // Update messages state immediately using functional update
      setMessages(prevMessages => {
        // Check if message already exists in state using a more precise comparison
        const exists = prevMessages.some(m => {
          // Check by ID first
          if (m._id === messageWithSender._id) return true;
          
          // Check by content and sender if no ID match
          if (m.content === messageWithSender.content && 
              m.sender === messageWithSender.sender) {
            // Only consider it a duplicate if timestamps are very close (within 1 second)
            const timeDiff = Math.abs(new Date(m.timestamp) - new Date(messageWithSender.timestamp));
            return timeDiff < 1000;
          }
          
          return false;
        });

        if (exists) {
          return prevMessages;
        }

        // Update last message timestamp
        setLastMessageTimestamp(messageWithSender.timestamp);
        return [...prevMessages, messageWithSender];
      });

      // Force scroll to bottom after state update
      setTimeout(scrollToBottom, 100);
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      console.log('Message sent confirmation received:', data, 'User type:', userType);
      const { message } = data;
      
      if (!message || !message.content) {
        console.warn('Received invalid message confirmation:', message);
        return;
      }

      // Update the message in state with the confirmed version using functional update
      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => 
          msg._id === message._id || msg._id === `temp_${message._id}` ? message : msg
        );
        console.log('Updated messages after confirmation:', updatedMessages);
        return updatedMessages;
      });
    };

    // Listen for connection status
    const handleConnect = () => {
      console.log('Socket connected, joining chat room:', chat._id, 'User type:', userType);
      joinChat(chat._id);
    };

    // Listen for disconnection
    const handleDisconnect = (reason) => {
      console.log('Socket disconnected:', reason, 'User type:', userType);
      setIsInRoom(false);
      if (reason !== 'io client disconnect') {
        socket.connect();
      }
    };

    // Listen for errors
    const handleError = (error) => {
      console.error('Socket error:', error, 'User type:', userType);
    };

    // Listen for user joined
    const handleUserJoined = (data) => {
      console.log('User joined chat:', data, 'User type:', userType);
    };

    // Listen for user left
    const handleUserLeft = (data) => {
      console.log('User left chat:', data, 'User type:', userType);
    };

    // Listen for user disconnected
    const handleUserDisconnected = (data) => {
      console.log('User disconnected:', data, 'User type:', userType);
    };

    // Set up all socket listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_disconnected', handleUserDisconnected);
    socket.on('room_joined', handleRoomJoined);

    // Add a reconnection handler
    const handleReconnect = () => {
      console.log('Socket reconnected, rejoining chat room:', chat._id, 'User type:', userType);
      joinChat(chat._id);
    };

    socket.on('reconnect', handleReconnect);

    // Clean up listeners
    return () => {
      console.log('Cleaning up socket listeners for chat:', chat._id, 'User type:', userType);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_disconnected', handleUserDisconnected);
      socket.off('reconnect', handleReconnect);
      socket.off('room_joined', handleRoomJoined);
      leaveChat(chat._id);
      pendingMessagesRef.current.clear();
      setIsInRoom(false);
    };
  }, [chat?._id, socket, joinChat, leaveChat, userType, isInRoom]);

  // Add a new effect to handle chat initialization
  useEffect(() => {
    if (appointmentId) {
      initializeChat();
    }
  }, [appointmentId]);

  // Add a new effect to handle message updates
  useEffect(() => {
    console.log('Messages updated:', messages);
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      let response;
      if (userType === 'doctor') {
        response = await axios.post('/doctor/chats', {
          patientId: patientId,
          appointmentId: appointmentId
        });
      } else {
        response = await axios.post('/chat', {
          doctorId: doctorId,
          appointmentId: appointmentId
        });
      }

      if (response.data) {
        console.log('Chat initialized:', response.data);
        setChat(response.data);
        setMessages(response.data.messages || []);
        
        // Set current user based on userType
        const currentUserData = userType === 'doctor' 
          ? response.data.doctorId 
          : response.data.patientId;
        
        console.log('Setting current user:', currentUserData);
        setCurrentUser(currentUserData);

        // Join chat room immediately after initialization
        if (socket && socket.connected) {
          console.log('Joining chat room after initialization:', response.data._id);
          joinChat(response.data._id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to initialize chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setError('Failed to initialize chat. Please try again.');
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!isConnected || !chat?._id || !isWithinAppointmentTime) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing status
    socket.emit('typing', { chatId: chat._id });

    // Set timeout to stop typing status
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId: chat._id });
    }, 2000);
  };

  const formatTime = (date) => {
    try {
      if (!date) return '';
      const messageDate = new Date(date);
      if (isNaN(messageDate.getTime())) return '';
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isAppointmentOver || !chat?._id || !currentUser?._id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Create temporary message with a unique ID
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: currentUser._id,
      senderType: userType,
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', tempMessage, 'User type:', userType);

    // Add to pending messages
    pendingMessagesRef.current.add(`${tempId}_${tempMessage.timestamp}`);

    // Update local state immediately with temporary message
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      // Save to database
      const endpoint = userType === 'doctor' 
        ? `/doctor/chats/${chat._id}/message`
        : `/chat/${chat._id}/message`;

      const response = await axios.post(endpoint, {
        content: messageContent,
        sender: currentUser._id,
        senderType: userType,
        appointmentId: appointmentId,
        timestamp: tempMessage.timestamp
      });

      console.log('Message saved to database:', response.data, 'User type:', userType);

      // Ensure response data has all required fields
      const savedMessage = {
        ...response.data,
        content: response.data.content || messageContent,
        sender: currentUser._id,
        senderType: userType,
        timestamp: response.data.timestamp || tempMessage.timestamp
      };

      // Remove the temporary message
      setMessages(prev => prev.filter(m => m._id !== tempId));

      // Send through socket
      if (socket && socket.connected) {
        console.log('Sending message through socket:', savedMessage);
        socket.emit('send_message', {
          chatId: chat._id,
          message: savedMessage
        });
      } else {
        console.warn('Socket not connected, message will be sent when connection is restored');
        // The message will be sent when socket reconnects
      }

    } catch (error) {
      console.error('Error sending message:', error, 'User type:', userType);
      setError('Failed to send message. Please try again.');
      // Remove only the temporary message on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  // Add a new effect to handle socket connection status
  useEffect(() => {
    if (!socket) return;

    const checkConnection = () => {
      if (!socket.connected) {
        console.log('Socket disconnected, attempting to reconnect...', {
          userType,
          chatId: chat?._id,
          messageCount: messages.length
        });
      }
    };

    // Check connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, [socket, chat?._id, userType, messages.length]);

  // Add a new effect to handle chat room membership
  useEffect(() => {
    if (!socket || !chat?._id) return;

    const checkRoomMembership = () => {
      if (socket.connected && !isInRoom) {
        console.log('Not in chat room, attempting to rejoin:', {
          chatId: chat._id,
          userType,
          connected: socket.connected
        });
        joinChat(chat._id);
      }
    };

    // Check room membership every 5 seconds
    const interval = setInterval(checkRoomMembership, 5000);

    return () => clearInterval(interval);
  }, [socket, chat?._id, userType, isInRoom, joinChat]);

  // Add a function to fetch messages
  const fetchMessages = async () => {
    if (!chat?._id) return;
    
    try {
      const endpoint = userType === 'doctor' 
        ? `/doctor/chats/${chat._id}`
        : `/chat/${chat._id}`;
      
      const response = await axios.get(endpoint);
      const newMessages = response.data.messages || [];
      
      // Update messages state only if we have new messages
      setMessages(prevMessages => {
        // Get the latest message timestamp from previous messages
        const prevLatestTimestamp = prevMessages.length > 0 
          ? new Date(prevMessages[prevMessages.length - 1].timestamp).getTime()
          : 0;

        // Filter out messages we already have
        const uniqueNewMessages = newMessages.filter(msg => {
          const msgTimestamp = new Date(msg.timestamp).getTime();
          return msgTimestamp > prevLatestTimestamp;
        });

        if (uniqueNewMessages.length > 0) {
          console.log('Fetched new messages:', uniqueNewMessages.length);
          return [...prevMessages, ...uniqueNewMessages];
        }
        return prevMessages;
      });

      // Update last message timestamp
      if (newMessages.length > 0) {
        setLastMessageTimestamp(newMessages[newMessages.length - 1].timestamp);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Set up periodic message refresh
  useEffect(() => {
    if (!chat?._id || !isWithinAppointmentTime) return;

    // Initial fetch
    fetchMessages();

    // Set up periodic refresh every 3 seconds
    refreshIntervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [chat?._id, isWithinAppointmentTime]);

  if (loading) {
    return <Text>Loading chat...</Text>;
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!chat) {
    return (
      <Alert status="warning">
        <AlertIcon />
        Chat not initialized. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      h="600px"
      display="flex"
      flexDirection="column"
    >
      <Box mb={4}>
        <Text fontWeight="bold">Appointment Chat</Text>
        <Text fontSize="sm" color="gray.500">
          {new Date(appointmentDate).toLocaleDateString()} at {appointmentTime}
        </Text>
        {!isWithinAppointmentTime && !isAppointmentOver && (
          <Alert status="info" mt={2}>
            <AlertIcon />
            Chat is only available 30 minutes before and after the appointment time
          </Alert>
        )}
        {isAppointmentOver && (
          <Alert status="info" mt={2}>
            <AlertIcon />
            This appointment has ended. You can view the chat history but cannot send new messages.
          </Alert>
        )}
      </Box>
      
      <Divider mb={4} />

      <Box flex="1" overflowY="auto" mb={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((message, index) => {
            const isSentByMe = message.sender === currentUser?._id;
            const messageContent = message.content || message.message || '';
            
            return (
              <Flex
                key={`${message._id}_${message.timestamp}_${index}`}
                justify={isSentByMe ? 'flex-end' : 'flex-start'}
                width="100%"
              >
                <Box
                  maxW="70%"
                  bg={isSentByMe ? 'blue.100' : 'gray.100'}
                  p={3}
                  borderRadius="lg"
                  ml={isSentByMe ? 'auto' : '0'}
                  mr={isSentByMe ? '0' : 'auto'}
                >
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    {formatTime(message.timestamp)}
                  </Text>
                  <Text>{messageContent}</Text>
                </Box>
              </Flex>
            );
          })}
          {typingUsers.size > 0 && (
            <Flex justify="flex-start" width="100%">
              <Box
                maxW="70%"
                bg="gray.100"
                p={3}
                borderRadius="lg"
              >
                <Text fontSize="sm" color="gray.500">
                  {typingUsers.size === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
                </Text>
              </Box>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <form onSubmit={handleSendMessage}>
        <Flex>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleTyping}
            placeholder={
              isAppointmentOver 
                ? "This appointment has ended. Chat is read-only."
                : isWithinAppointmentTime 
                  ? "Type your message..." 
                  : "Chat is only available during appointment time"
            }
            mr={2}
            isDisabled={!isWithinAppointmentTime}
          />
          <Button 
            type="submit" 
            colorScheme="blue"
            isDisabled={!isWithinAppointmentTime}
          >
            Send
          </Button>
        </Flex>
      </form>
    </Box>
  );
};

export default AppointmentChat; 