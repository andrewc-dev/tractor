// Define types for the application

export interface Player {
  id: string;
  name: string;
  hand: Card[];
}

export interface Card {
  suit: string;
  value: string;
}

export interface GameRoom {
  id: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'active' | 'finished';
  deck: Card[];
  createdAt: number;
  gameType: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  roomName?: string;
}

export interface JoinGameData {
  gameId: string;
  playerId: string;
  playerName: string;
}

export interface PlayCardData {
  gameId: string;
  playerId: string;
  card: Card;
}

// Interface for database models
export interface PlayerDB {
  id: string;
  gameId: string;
  name: string;
  hand: string; // JSON string of cards
} 