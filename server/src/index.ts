import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { initDatabase } from './models.js';
import { GameService } from './db.js';
import { Card, GameRoom, JoinGameData, PlayCardData, Player } from './types.js';

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

  
  // Initialize SQLite database
  const dbInitialized = await initDatabase();
  if (!dbInitialized) {
    console.error('Failed to initialize SQLite database. Exiting...');
    process.exit(1);
  }
  
  // Game room management
  app.get('/', (req: Request, res: Response) => {
    res.sendFile(process.cwd() + '/index.html');
  });

  // Create a new game room
  app.post('/api/game', async (req: Request, res: Response) => {
    const { gameType = 'Tractor', playerCount = 4, roomName = '' } = req.body;
    const gameId = uuidv4().substring(0, 6);
    const gameRoom: GameRoom = {
      id: gameId,
      players: [],
      maxPlayers: playerCount,
      status: 'waiting',
      deck: generateDeck(),
      createdAt: Date.now(),
      gameType,
      roomName
    };
    
    // Store in both Redis and SQLite
    await redisClient.set(`game:${gameId}`, JSON.stringify(gameRoom));
    await GameService.createGame(gameRoom);
    
    res.json({
      success: true,
      gameId,
      link: `http://localhost:3000/game/${gameId}`
    });
  });

  // Get game room status
  app.get('/api/game/:gameId', async (req: Request, res: Response) => {
    const { gameId } = req.params;
    
    // Try to get from SQLite first
    const gameFromDB = await GameService.findGame(gameId);
    
    if (gameFromDB) {
      return res.json({
        success: true,
        game: {
          id: gameFromDB.id,
          playerCount: gameFromDB.players.length,
          maxPlayers: gameFromDB.maxPlayers,
          status: gameFromDB.status,
          gameType: gameFromDB.gameType,
          roomName: gameFromDB.roomName
        }
      });
    }
    
    // Fallback to Redis
    const gameData = await redisClient.get(`game:${gameId}`);
    
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
        status: game.status,
        gameType: game.gameType,
        roomName: game.roomName
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
    
    // Try to find game in SQLite
    let game = await GameService.findGame(gameId);
    
    // If not in SQLite, try Redis
    if (!game) {
      const gameData = await redisClient.get(`game:${gameId}`);
      
      if (!gameData) {
        return res.status(404).json({ success: false, message: 'Game not found' });
      }
      
      game = JSON.parse(gameData);
    }
    
    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({ success: false, message: 'Game room is full' });
    }
    
    // Check if player already joined
    if (!game.players.find(p => p.id === playerId)) {
      const newPlayer = {
        id: playerId,
        name: playerName,
        hand: []
      };
      
      game.players.push(newPlayer);
      
      // Add player to SQLite
      await GameService.addPlayer(gameId, newPlayer);
    }
    
    // If we have enough players, change status to ready
    if (game.players.length === game.maxPlayers) {
      game.status = 'ready';
    }
    
    // Update in both Redis and SQLite
    await redisClient.set(`game:${gameId}`, JSON.stringify(game));
    await GameService.updateGame(game);
    
    res.json({
      success: true,
      game: {
        id: game.id,
        playerCount: game.players.length,
        maxPlayers: game.maxPlayers,
        status: game.status,
        gameType: game.gameType,
        roomName: game.roomName
      }
    });
  });

  // Deal cards to players
  app.post('/api/game/:gameId/deal', async (req: Request, res: Response) => {
    const { gameId } = req.params;
    
    // Try to find game in SQLite
    let game = await GameService.findGame(gameId);
    
    // If not in SQLite, try Redis
    if (!game) {
      const gameData = await redisClient.get(`game:${gameId}`);
      
      if (!gameData) {
        return res.status(404).json({ success: false, message: 'Game not found' });
      }
      
      game = JSON.parse(gameData);
    }
    
    if (game.status !== 'ready') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot deal cards. Game status is ${game.status}, needs to be ready` 
      });
    }
    
    // Deal 5 cards to each player
    game.players.forEach(player => {
      player.hand = dealCards(game.deck, 5);
      
      // Update player's hand in SQLite
      GameService.updatePlayerHand(gameId, player.id, player.hand);
    });
    
    game.status = 'active';
    
    // Update in both Redis and SQLite
    await redisClient.set(`game:${gameId}`, JSON.stringify(game));
    await GameService.updateGame(game);
    
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
      
      // Try to find game in SQLite
      let game = await GameService.findGame(gameId);
      
      // If not in SQLite, try Redis
      if (!game) {
        const gameData = await redisClient.get(`game:${gameId}`);
        
        if (!gameData) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        game = JSON.parse(gameData);
      }
      
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