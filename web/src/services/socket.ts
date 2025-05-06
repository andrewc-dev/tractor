import { io } from 'socket.io-client';
import { Card, PlayerJoinedEvent, GameReadyEvent, CardPlayedEvent, ErrorEvent } from '../types';
import { API_URL } from './api';

// Adding new event interfaces
export interface GamePausedEvent {
  playerId: string;
  playerName: string;
  message: string;
  status: string;
}

export interface GameResumedEvent {
  playerId: string;
  playerName: string;
  status: string;
}

export interface GameEndedEvent {
  message: string;
  status: string;
}

export class GameConnection {
  private socket: any = null;
  private static instance: GameConnection | null = null;
  
  private constructor() {}
  
  // Singleton pattern to ensure only one connection
  public static getInstance(): GameConnection {
    if (!GameConnection.instance) {
      GameConnection.instance = new GameConnection();
    }
    return GameConnection.instance;
  }
  
  // Initialize and connect the socket
  public async connect(): Promise<void> {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }
    
    try {
      this.socket = io(API_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket connection handlers
      this.socket.on('connect', () => {
        console.log('Socket connected!');
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });
      
      // Wait for connection
      if (!this.socket.connected) {
        await new Promise<void>((resolve) => {
          if (this.socket && !this.socket.connected) {
            this.socket.on('connect', () => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      }
    } catch (error) {
      console.error('Socket initialization error:', error);
      throw error;
    }
  }
  
  // Join a game room
  public joinGameRoom(gameId: string, playerId: string, playerName: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }
    
    console.log('Joining game room:', gameId);
    this.socket.emit('joinGame', { gameId, playerId, playerName });
  }
  
  // Play a card
  public playCard(gameId: string, playerId: string, card: Card): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }
    
    this.socket.emit('playCard', { gameId, playerId, card });
  }
  
  // Listen for player joined event
  public listenForPlayerJoined(callback: (data: PlayerJoinedEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('playerJoined', (data: PlayerJoinedEvent) => {
      callback(data);
    });
  }
  
  // Listen for game ready event
  public listenForGameReady(callback: (data: GameReadyEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('gameReady', (data: GameReadyEvent) => {
      callback(data);
    });
  }
  
  // Listen for card played event
  public listenForCardPlayed(callback: (data: CardPlayedEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('cardPlayed', (data: CardPlayedEvent) => {
      callback(data);
    });
  }
  
  // Listen for error event
  public listenForError(callback: (data: ErrorEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('error', (data: ErrorEvent) => {
      callback(data);
    });
  }
  
  // Listen for game paused event
  public listenForGamePaused(callback: (data: GamePausedEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('gamePaused', (data: GamePausedEvent) => {
      console.log('Game paused event received:', data);
      callback(data);
    });
  }
  
  // Listen for game resumed event
  public listenForGameResumed(callback: (data: GameResumedEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('gameResumed', (data: GameResumedEvent) => {
      console.log('Game resumed event received:', data);
      callback(data);
    });
  }
  
  // Listen for game ended event
  public listenForGameEnded(callback: (data: GameEndedEvent) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('gameEnded', (data: GameEndedEvent) => {
      console.log('Game ended event received:', data);
      callback(data);
    });
  }
  
  // Disconnect socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Check connection status
  public isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }
}

// Compatibility functions for existing code - these now use the GameConnection class
export const initializeSocket = async (): Promise<any> => {
  const gameConnection = GameConnection.getInstance();
  await gameConnection.connect();
  return gameConnection.isConnected() ? gameConnection['socket'] : null;
};

export const joinGameRoom = async (gameId: string, playerId: string, playerName: string): Promise<void> => {
  try {
    const gameConnection = GameConnection.getInstance();
    if (!gameConnection.isConnected()) {
      await gameConnection.connect();
    }
    gameConnection.joinGameRoom(gameId, playerId, playerName);
  } catch (error) {
    console.error('Error joining game room:', error);
  }
};

export const playCard = (gameId: string, playerId: string, card: Card): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.playCard(gameId, playerId, card);
};

export const listenForPlayerJoined = (callback: (data: PlayerJoinedEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForPlayerJoined(callback);
};

export const listenForGameReady = (callback: (data: GameReadyEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForGameReady(callback);
};

export const listenForCardPlayed = (callback: (data: CardPlayedEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForCardPlayed(callback);
};

export const listenForError = (callback: (data: ErrorEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForError(callback);
};

export const listenForGamePaused = (callback: (data: GamePausedEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForGamePaused(callback);
};

export const listenForGameResumed = (callback: (data: GameResumedEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForGameResumed(callback);
};

export const listenForGameEnded = (callback: (data: GameEndedEvent) => void): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.listenForGameEnded(callback);
};

export const disconnectSocket = (): void => {
  const gameConnection = GameConnection.getInstance();
  gameConnection.disconnect();
};

export default {
  GameConnection,
  initializeSocket,
  joinGameRoom,
  playCard,
  listenForPlayerJoined,
  listenForGameReady,
  listenForCardPlayed,
  listenForError,
  listenForGamePaused,
  listenForGameResumed,
  listenForGameEnded,
  disconnectSocket
}; 