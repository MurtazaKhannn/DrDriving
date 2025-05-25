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
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { PhoneIcon } from '@chakra-ui/icons';
import axios from '../../utils/axios';
import { useSocket } from '../../contexts/SocketContext';
import VideoCall from './VideoCall';

// Custom Video Camera Icon
const VideoCameraIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
    />
  </Icon>
);

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
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [userName, setUserName] = useState('');

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
      return;
    }

    // Join chat room immediately if socket is connected
    if (socket.connected) {
      joinChat(chat._id);
    }

    // Listen for room joined confirmation
    const handleRoomJoined = (data) => {
      const { rooms } = data;
      const isInChatRoom = rooms.includes(chat._id);
      setIsInRoom(isInChatRoom);
    };

    // Listen for new messages
    const handleNewMessage = (data) => {
      const { message } = data;
      
      if (!message || !message.content) {
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
        _id: message._id,
        sender: message.sender?._id || message.sender,
        senderType: message.senderType || userType,
        content: message.content || message.message || '',
        timestamp: message.timestamp || new Date().toISOString()
      };

      // Update messages state immediately using functional update
      setMessages(prevMessages => {
        // Check if message already exists in state
        const exists = prevMessages.some(m => 
          m._id === messageWithSender._id || 
          (m.content === messageWithSender.content && 
           m.sender === messageWithSender.sender && 
           Math.abs(new Date(m.timestamp) - new Date(messageWithSender.timestamp)) < 1000)
        );
        
        if (exists) {
          return prevMessages;
        }

        // Add new message and sort by timestamp
        const updatedMessages = [...prevMessages, messageWithSender].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Update last message timestamp
        setLastMessageTimestamp(messageWithSender.timestamp);
        return updatedMessages;
      });

      // Force scroll to bottom after state update
      setTimeout(scrollToBottom, 100);
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      const { message } = data;
      
      if (!message || !message.content) {
        return;
      }

      // Update the message in state with the confirmed version
      setMessages(prevMessages => {
        // Replace temporary message with confirmed message
        const updatedMessages = prevMessages.map(msg => 
          msg._id === message._id || 
          msg._id === `temp_${message._id}` || 
          (msg.content === message.content && 
           msg.sender === message.sender && 
           Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
            ? message 
            : msg
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return updatedMessages;
      });
    };

    // Listen for connection status
    const handleConnect = () => {
      joinChat(chat._id);
    };

    // Listen for disconnection
    const handleDisconnect = (reason) => {
      setIsInRoom(false);
      if (reason !== 'io client disconnect') {
        socket.connect();
      }
    };

    // Set up all socket listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('room_joined', handleRoomJoined);

    // Clean up listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('room_joined', handleRoomJoined);
      leaveChat(chat._id);
      pendingMessagesRef.current.clear();
      setIsInRoom(false);
    };
  }, [chat?._id, socket, joinChat, leaveChat, currentUser?._id]); // Remove userType and isInRoom from dependencies

  // Add a new effect to handle chat initialization
  useEffect(() => {
    if (appointmentId) {
      initializeChat();
    }
  }, [appointmentId]);

  // Add a new effect to handle message updates
  useEffect(() => {
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
        setChat(response.data);
        setMessages(response.data.messages || []);
        
        // Set current user based on userType
        const currentUserData = userType === 'doctor' 
          ? response.data.doctorId 
          : response.data.patientId;
        
        setCurrentUser(currentUserData);

        // Join chat room immediately after initialization
        if (socket && socket.connected) {
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
    if (!newMessage.trim() || !chat?._id || !isWithinAppointmentTime) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    const tempId = `temp_${Date.now()}`;

    // Add temporary message to UI
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: currentUser._id,
      senderType: userType,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Update messages state with temporary message
    setMessages(prev => {
      const filtered = prev.filter(m => !(m._id === tempId));
      return [...filtered, tempMessage].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    });

    try {
      // Save to database
      const endpoint = userType === 'doctor' 
        ? `/doctor/chats/${chat._id}/message`
        : `/chat/${chat._id}/message`;

      const response = await axios.post(endpoint, {
        content: messageContent,
        appointmentId: appointmentId,
        sender: currentUser._id,
        senderType: userType
      });

      // Send through socket
      if (socket && socket.connected) {
        // Add message to pending messages before sending
        pendingMessagesRef.current.add(`${response.data._id}_${response.data.timestamp}`);
        socket.emit('send_message', {
          chatId: chat._id,
          message: response.data
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      // Remove temporary message on error
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

    // Set up periodic refresh every 10 seconds instead of 3
    refreshIntervalRef.current = setInterval(fetchMessages, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [chat?._id, isWithinAppointmentTime]);

  // Add this useEffect to fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const endpoint = userType === 'doctor' ? `/doctors/${doctorId}` : `/patients/${patientId}`;
        const response = await axios.get(endpoint);
        setUserName(response.data.name);
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();
  }, [userType, doctorId, patientId]);

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
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontWeight="bold">Appointment Chat</Text>
            <Text fontSize="sm" color="gray.500">
              {new Date(appointmentDate).toLocaleDateString()} at {appointmentTime}
            </Text>
          </Box>
          {isWithinAppointmentTime && !isAppointmentOver && (
            <IconButton
              icon={<VideoCameraIcon />}
              colorScheme="blue"
              onClick={() => setIsVideoCall(true)}
              aria-label="Start video call"
            />
          )}
        </Flex>
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
            // Determine if message is from current user based on sender ID
            const isSentByMe = message.sender === currentUser?._id;
            const messageContent = message.content || message.message || '';
            
            // Skip rendering if this is a duplicate message
            if (index > 0 && messages[index - 1]._id === message._id) {
              return null;
            }
            
            return (
              <Flex
                key={`${message._id}_${message.timestamp}_${index}`}
                justify={isSentByMe ? 'flex-end' : 'flex-start'}
                width="100%"
                mb={2}
              >
                <Box
                  maxW="70%"
                  bg={isSentByMe ? 'blue.100' : 'gray.100'}
                  p={3}
                  borderRadius="lg"
                  ml={isSentByMe ? 'auto' : '0'}
                  mr={isSentByMe ? '0' : 'auto'}
                  position="relative"
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

      {/* Add VideoCall component */}
      <VideoCall
        isOpen={isVideoCall}
        onClose={() => setIsVideoCall(false)}
        appointmentId={appointmentId}
        userType={userType}
        userName={userName}
      />
    </Box>
  );
};

export default AppointmentChat; 