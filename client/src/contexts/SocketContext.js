import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useToast } from '@chakra-ui/react';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const toast = useToast();

  const initializeSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || !userType) {
      console.warn('No token or user type found, socket connection skipped');
      return null;
    }

    console.log('Initializing socket connection...', { userType });
    
    const newSocket = io('http://localhost:5000', {
      auth: { 
        token,
        userType 
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      forceNew: true,
      timeout: 10000,
      query: { userType }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully', { userType });
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionAttempts(prev => prev + 1);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          if (newSocket) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: 'Connection Error',
        description: 'There was a problem with the chat connection. Please try refreshing the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    return newSocket;
  }, [toast]);

  useEffect(() => {
    const newSocket = initializeSocket();
    if (newSocket) {
      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
      }
    };
  }, [initializeSocket]);

  useEffect(() => {
    if (!isConnected && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      const timer = setTimeout(() => {
        console.log(`Retrying socket connection (attempt ${connectionAttempts + 1})`);
        const newSocket = initializeSocket();
        if (newSocket) {
          setSocket(newSocket);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionAttempts, initializeSocket]);

  const joinChat = useCallback((chatId) => {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      if (socket) {
        socket.connect();
        // Wait for connection and retry joining
        setTimeout(() => {
          if (socket && socket.connected) {
            console.log('Socket reconnected, joining chat:', chatId);
            socket.emit('join_chat', { 
              chatId, 
              userType: localStorage.getItem('userType') 
            });
          }
        }, 1000);
      }
      return;
    }

    console.log('Joining chat room:', chatId);
    socket.emit('join_chat', { 
      chatId, 
      userType: localStorage.getItem('userType') 
    });
  }, [socket]);

  const leaveChat = useCallback((chatId) => {
    if (!socket || !isConnected) return;
    
    console.log('Leaving chat room:', chatId);
    socket.emit('leave_chat', { 
      chatId,
      userType: localStorage.getItem('userType')
    });
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId, message) => {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      if (socket) {
        socket.connect();
        // Wait for connection and retry sending
        setTimeout(() => {
          if (socket && socket.connected) {
            console.log('Socket reconnected, sending message:', message);
            socket.emit('send_message', { 
              chatId, 
              message,
              userType: localStorage.getItem('userType')
            });
          }
        }, 1000);
      }
      return;
    }

    console.log('Sending message to chat:', chatId, message);
    socket.emit('send_message', { 
      chatId, 
      message,
      userType: localStorage.getItem('userType')
    });
  }, [socket]);

  const sendTypingStatus = useCallback((chatId, isTyping) => {
    if (socket && isConnected) {
      if (isTyping) {
        socket.emit('typing', { chatId });
      } else {
        socket.emit('stop_typing', { chatId });
      }
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    sendTypingStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 