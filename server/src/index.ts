import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Define types
interface Player {
  id: string;
  name: string;
  hand: Card[];
}

interface Card {
  suit: string;
  value: string;
}

interface GameRoom {
  id: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'active' | 'finished';
  deck: Card[];
  createdAt: number;
}

interface JoinGameData {
  gameId: string;
  playerId: string;
  playerName: string;
}

interface PlayCardData {
  gameId: string;
  playerId: string;
  card: Card;
}

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());
app.use(cors());

// Main async function
const main = async () => {
  const client = createClient();

  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();

  // Game room management
  app.get('/', (req: Request, res: Response) => {
    res.sendFile(process.cwd() + '/index.html');
  });

  // Create a new game room
  app.post('/api/game', async (req: Request, res: Response) => {
    const gameId = uuidv4().substring(0, 6);
    const gameRoom: GameRoom = {
      id: gameId,
      players: [],
      maxPlayers: 4,
      status: 'waiting',
      deck: generateDeck(),
      createdAt: Date.now()
    };
    
    await client.set(`game:${gameId}`, JSON.stringify(gameRoom));
    
    res.json({
      success: true,
      gameId,
      link: `http://localhost:3000/game/${gameId}`
    });
  });

  // Get game room status
  app.get('/api/game/:gameId', async (req: Request, res: Response) => {
    const { gameId } = req.params;
    const gameData = await client.get(`game:${gameId}`);
    
    if (!gameData) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    const game: GameRoom = JSON.parse(gameData);
    res.json({
      success: true,
      game: {
        id: game.id,
        playerCount: game.players.length,
        maxPlayers: game.maxPlayers,
        status: game.status
      }
    });
  });

  // Join a game room
  app.post('/api/game/:gameId/join', async (req: Request, res: Response) => {
    const { gameId } = req.params;
    const { playerId, playerName } = req.body;
    
    if (!playerId || !playerName) {
      return res.status(400).json({ success: false, message: 'Player ID and name are required' });
    }
    
    const gameData = await client.get(`game:${gameId}`);
    
    if (!gameData) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    const game: GameRoom = JSON.parse(gameData);
    
    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({ success: false, message: 'Game room is full' });
    }
    
    // Check if player already joined
    if (!game.players.find(p => p.id === playerId)) {
      game.players.push({
        id: playerId,
        name: playerName,
        hand: []
      });
    }
    
    // If we have 4 players, change status to ready
    if (game.players.length === game.maxPlayers) {
      game.status = 'ready';
    }
    
    await client.set(`game:${gameId}`, JSON.stringify(game));
    
    res.json({
      success: true,
      game: {
        id: game.id,
        playerCount: game.players.length,
        maxPlayers: game.maxPlayers,
        status: game.status
      }
    });
  });

  // Deal cards to players
  app.post('/api/game/:gameId/deal', async (req: Request, res: Response) => {
    const { gameId } = req.params;
    const gameData = await client.get(`game:${gameId}`);
    
    if (!gameData) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    const game: GameRoom = JSON.parse(gameData);
    
    if (game.status !== 'ready') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot deal cards. Game status is ${game.status}, needs to be ready` 
      });
    }
    
    // Deal 5 cards to each player
    game.players.forEach(player => {
      player.hand = dealCards(game.deck, 5);
    });
    
    game.status = 'active';
    
    await client.set(`game:${gameId}`, JSON.stringify(game));
    
    res.json({
      success: true,
      message: 'Cards dealt successfully',
      game: {
        id: game.id,
        status: game.status
      }
    });
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    // Join a game room
    socket.on('joinGame', async (data: JoinGameData) => {
      const { gameId, playerId, playerName } = data;
      
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game ID and Player ID are required' });
        return;
      }
      
      // Join the socket room
      socket.join(gameId);
      console.log(`Player ${playerId} (${playerName}) joined game ${gameId}`);
      
      // Get the current game state
      const gameData = await client.get(`game:${gameId}`);
      
      if (!gameData) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      const game: GameRoom = JSON.parse(gameData);
      
      // Notify all clients in the room
      io.to(gameId).emit('playerJoined', {
        playerId,
        playerName,
        playerCount: game.players.length,
        status: game.status
      });
      
      // If the room is full, notify clients to start the game
      if (game.players.length === game.maxPlayers) {
        io.to(gameId).emit('gameReady', {
          playerCount: game.players.length,
          status: game.status
        });
      }
    });
    
    // Handle player actions
    socket.on('playCard', async (data: PlayCardData) => {
      const { gameId, playerId, card } = data;
      
      // Implementation for playing cards
      // ...
      
      io.to(gameId).emit('cardPlayed', { playerId, card });
    });
    
    socket.on('disconnect', () => {
      console.log('Player disconnected');
    });
  });

  server.listen(3000, () => {
    console.log('Server listening on *:3000');
  });
};

// Helper functions

// Generate a standard deck of 52 cards
function generateDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value
      });
    }
  }
  
  // Shuffle the deck
  return shuffleDeck(deck);
}

// Shuffle a deck of cards
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Deal a specific number of cards from a deck
function dealCards(deck: Card[], count: number): Card[] {
  return deck.splice(0, count);
}

// Start the application
main().catch(console.error); 