// Type definitions for Card Game

// Player
export interface Player {
  id: string;
  name: string;
  hand?: Card[];
}

// Card
export interface Card {
  suit: string;
  value: string;
}

// Game
export interface Game {
  id: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'active' | 'finished';
  gameType?: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  roomName?: string;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  game?: Game;
  [key: string]: any;
}

// Socket Events
export interface PlayerJoinedEvent {
  playerId: string;
  playerName: string;
  playerCount: number;
  status: string;
}

export interface GameReadyEvent {
  playerCount: number;
  status: string;
}

export interface CardPlayedEvent {
  playerId: string;
  card: Card;
}

export interface ErrorEvent {
  message: string;
}

// Game State
export interface GameState {
  status: string;
  players: Player[];
  currentPlayer: string | null;
  playedCards: {
    playerId: string;
    card: Card;
  }[];
}

// Component Props
export interface ButtonProps {
  title: string;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  primary?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  name?: string;
  id?: string;
  className?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
}

export interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export interface LoadingSpinnerProps {
  message?: string;
} 