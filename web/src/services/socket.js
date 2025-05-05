import { io } from 'socket.io-client';

// Server URL - change this to match your server's address
const SOCKET_URL = 'http://localhost:3000';

let socket = null;

export const initializeSocket = async () => {
  try {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket connection handlers
      socket.on('connect', () => {
        console.log('Socket connected!');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    }
    
    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    throw error;
  }
};

export const joinGameRoom = async (gameId, playerId, playerName) => {
  try {
    await initializeSocket();
    
    if (socket && socket.connected) {
      socket.emit('joinGame', { gameId, playerId, playerName });
    } else {
      console.error('Socket not connected');
    }
  } catch (error) {
    console.error('Error joining game room:', error);
  }
};

export const playCard = (gameId, playerId, card) => {
  if (socket && socket.connected) {
    socket.emit('playCard', { gameId, playerId, card });
  }
};

export const listenForPlayerJoined = (callback) => {
  if (socket) {
    socket.on('playerJoined', (data) => {
      callback(data);
    });
  }
};

export const listenForGameReady = (callback) => {
  if (socket) {
    socket.on('gameReady', (data) => {
      callback(data);
    });
  }
};

export const listenForCardPlayed = (callback) => {
  if (socket) {
    socket.on('cardPlayed', (data) => {
      callback(data);
    });
  }
};

export const listenForError = (callback) => {
  if (socket) {
    socket.on('error', (data) => {
      callback(data);
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  joinGameRoom,
  playCard,
  listenForPlayerJoined,
  listenForGameReady,
  listenForCardPlayed,
  listenForError,
  disconnectSocket
}; 