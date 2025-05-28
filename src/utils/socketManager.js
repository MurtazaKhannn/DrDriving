import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.healthCheckInterval = null;
  }

  connect(token, userType) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://drdriving.onrender.com';
    
    this.socket = io(SOCKET_URL, {
      auth: { token, userType },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventListeners();
    this.startHealthCheck();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    } else {
      console.error('Max reconnection attempts reached');
      this.stopHealthCheck();
    }
  }

  startHealthCheck() {
    // Clear any existing interval
    this.stopHealthCheck();

    // Check server health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://drdriving.onrender.com'}/health`);
        if (!response.ok) {
          console.warn('Health check failed');
        }
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.stopHealthCheck();
    }
  }
}

export const socketManager = new SocketManager(); 