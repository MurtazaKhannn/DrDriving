import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketManager } from '../utils/socketManager';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (token && userType) {
      try {
        const socketInstance = socketManager.connect(token, userType);
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          setIsConnected(true);
          setError(null);
        });

        socketInstance.on('connect_error', (err) => {
          setError(err.message);
          setIsConnected(false);
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });

        return () => {
          socketManager.disconnect();
        };
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const value = {
    socket,
    isConnected,
    error
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 