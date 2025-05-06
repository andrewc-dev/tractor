// Define types for the application

export interface Player {
  id: string;
  name: string;
}

export interface PlayerWithCards extends Player {
  cards: Card[];
}

export interface Card {
  suit: string; // Can be 'hearts', 'diamonds', 'clubs', 'spades' or empty
  value: string; // Regular card values or 'Big Joker' or 'Small Joker'
  isJoker?: boolean;
  isWild?: boolean;
}

export interface GameRoom {
  id: string;
  playersList: string[]; // Array of player IDs
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'active' | 'paused' | 'finished';
  createdAt: number;
  gameType: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  roomName?: string;
  instanceId?: string; // Reference to GameInstance
}

export interface GameInstance {
  id: string;
  deck: Card[];
  currentPlayer: string | null;
  roundNumber: number;
  gameState: any; // Additional game state
  players: PlayerWithCards[]; // Full player data with hands
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
