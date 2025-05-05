import { io } from 'socket.io-client';
import { Card, PlayerJoinedEvent, GameReadyEvent, CardPlayedEvent, ErrorEvent } from '../types';

// Server URL - change this to match your server's address
const SOCKET_URL = 'http://localhost:3000';

let socket: any = null;

export const initializeSocket = async (): Promise<any> => {
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

      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });
    }
    
    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    throw error;
  }
};

export const joinGameRoom = async (gameId: string, playerId: string, playerName: string): Promise<void> => {
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

export const playCard = (gameId: string, playerId: string, card: Card): void => {
  if (socket && socket.connected) {
    socket.emit('playCard', { gameId, playerId, card });
  }
};

export const listenForPlayerJoined = (callback: (data: PlayerJoinedEvent) => void): void => {
  if (socket) {
    socket.on('playerJoined', (data: PlayerJoinedEvent) => {
      callback(data);
    });
  }
};

export const listenForGameReady = (callback: (data: GameReadyEvent) => void): void => {
  if (socket) {
    socket.on('gameReady', (data: GameReadyEvent) => {
      callback(data);
    });
  }
};

export const listenForCardPlayed = (callback: (data: CardPlayedEvent) => void): void => {
  if (socket) {
    socket.on('cardPlayed', (data: CardPlayedEvent) => {
      callback(data);
    });
  }
};

export const listenForError = (callback: (data: ErrorEvent) => void): void => {
  if (socket) {
    socket.on('error', (data: ErrorEvent) => {
      callback(data);
    });
  }
};

export const disconnectSocket = (): void => {
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