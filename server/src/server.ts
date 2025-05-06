import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { initDatabase } from './models.js';
import { GameService } from './GameService.js';
import { Card, GameRoom, GameInstance, JoinGameData, PlayCardData, Player } from './types.js';
import { Logger } from './utils/logger.js';
import { generateDeck, shuffleDeck, dealCards } from './utils/cards.js';
// Initialize app
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const server = http.createServer(app);

// Initialize logger
const logger = Logger.getInstance();

// Track socket-player associations
interface SocketPlayerMap {
  [socketId: string]: {
    gameId: string;
    playerId: string;
    playerName: string;
  }
}

// Map to track socket ID to player/game info
const socketPlayerMap: SocketPlayerMap = {};

// Socket.io CORS config
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins in development
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure CORS middleware
const corsOptions = {
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(express.json());
app.use(cors(corsOptions));

// Add OPTIONS route handler for preflight requests
app.options('*', cors(corsOptions));

// Main async function
const main = async () => {

  
  // Initialize SQLite database
  const dbInitialized = await initDatabase();
  if (!dbInitialized) {
    logger.error('Failed to initialize SQLite database. Exiting...');
    process.exit(1);
  }
  
  // Game room management
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is running' });
  });

  // Create a new game room
  app.post('/api/game', async (req: Request, res: Response) => {
    const { gameType = 'Tractor', playerCount = 4, roomName = '' } = req.body;
    const gameId = uuidv4().substring(0, 6);
    const gameRoom: GameRoom = {
      id: gameId,
      playersList: [],
      maxPlayers: playerCount,
      status: 'waiting',
      createdAt: Date.now(),
      gameType,
      roomName
    };

    logger.info(`Creating game ${gameId} with room name ${roomName}`);
    
    await GameService.createGame(gameRoom);
    
    res.json({
      success: true,
      gameId,
      link: `http://localhost:${port}/game/${gameId}`
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
          playerCount: gameFromDB.playersList.length,
          maxPlayers: gameFromDB.maxPlayers,
          status: gameFromDB.status,
          gameType: gameFromDB.gameType,
          roomName: gameFromDB.roomName
        }
      });
    }
    
    // If we get here, game wasn't found
    return res.status(404).json({ 
      success: false, 
      message: 'Game not found' 
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
    
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    if (game.playersList.length >= game.maxPlayers) {
      return res.status(400).json({ success: false, message: 'Game room is full' });
    }
    
    // Check if player already joined
    if (!game.playersList.includes(playerId)) {
      const newPlayer = {
        id: playerId,
        name: playerName,
        hand: []
      };
      
      // Add player to SQLite
      await GameService.addPlayer(gameId, newPlayer);
      
      // Update players list in memory
      game.playersList.push(playerId);
    }
    
    // If we have enough players, change status to ready
    if (game.playersList.length === game.maxPlayers) {
      await GameService.updateGameStatus(gameId, 'ready');
    }
    
    // Get updated game from database
    game = await GameService.findGame(gameId);
    
    if (!game) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve updated game data' });
    }
    
    res.json({
      success: true,
      game: {
        id: game.id,
        playerCount: game.playersList.length,
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

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.status !== 'ready') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot deal cards. Game status is ${game.status}, needs to be ready` 
      });
    }
    
    // Create a new game instance with a shuffled deck
    const deck = shuffleDeck(generateDeck());
    const instanceId = await GameService.createGameInstance(gameId, deck);
    
    if (!instanceId) {
      return res.status(500).json({ success: false, message: 'Failed to create game instance' });
    }
    
    // Get all players for this game
    const players = await GameService.getPlayers(gameId);
    
    // Deal 5 cards to each player
    for (const player of players) {
      const hand = dealCards(deck, 5);
      await GameService.updatePlayerHand(gameId, player.id, hand);
    }
    
    // Update game status to active
    await GameService.updateGameStatus(gameId, 'active');
    
    // Get the updated game
    game = await GameService.findGame(gameId);
    if (!game) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve updated game data' });
    }
    
    res.json({
      success: true,
      game: {
        id: game.id,
        playerCount: game.playersList.length,
        maxPlayers: game.maxPlayers,
        status: game.status
      }
    });
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Handle player joining a game room
    socket.on('joinGame', async (data: JoinGameData) => {
      const { gameId, playerId, playerName } = data;
      
      logger.info(`Player ${playerName} (${playerId}) joining game ${gameId}`);
      
      // Add socket to room
      socket.join(gameId);
      
      // Map socket ID to player info
      socketPlayerMap[socket.id] = {
        gameId,
        playerId,
        playerName
      };
      
      // Try to find game in SQLite
      const game = await GameService.findGame(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Handle reconnection to paused game
      if (game.status === 'paused') {
        // Check if this is the disconnected player rejoining
        const playerInGame = game.playersList.includes(playerId);
        if (playerInGame) {
          // Player is reconnecting to a paused game, resume the game
          await GameService.updateGameStatus(gameId, 'active');
          
          // Notify all clients that the game has resumed
          io.to(gameId).emit('gameResumed', {
            playerId,
            playerName,
            status: 'active'
          });
        }
      }
      
      // Notify all clients in the room about the new player
      io.to(gameId).emit('playerJoined', {
        playerId,
        playerName,
        playerCount: game.playersList.length,
        status: game.status
      });
      
      // If the room is full, notify clients to start the game
      if (game.playersList.length === game.maxPlayers) {
        io.to(gameId).emit('gameReady', {
          playerCount: game.playersList.length,
          status: game.status
        });
      }
    });

    // Handle playing a card
    socket.on('playCard', async (data: PlayCardData) => {
      const { gameId, playerId, card } = data;
      
      logger.info(`Player ${playerId} played card ${card.suit} ${card.value} in game ${gameId}`);
      
      // Check if we have the game instance
      const game = await GameService.findGame(gameId);
      if (!game || !game.instanceId) {
        socket.emit('error', { message: 'Game or game instance not found' });
        return;
      }
      
      const gameInstance = await GameService.getGameInstance(game.instanceId);
      if (!gameInstance) {
        socket.emit('error', { message: 'Game instance not found' });
        return;
      }
      
      // Update player's hand
      const player = gameInstance.players.find(p => p.id === playerId);
      if (!player) {
        socket.emit('error', { message: 'Player not found in game' });
        return;
      }
      
      // Remove card from player's hand
      const updatedHand = player.cards.filter(
        c => !(c.suit === card.suit && c.value === card.value)
      );
      
      // Save updated hand to database
      await GameService.updatePlayerHand(gameId, playerId, updatedHand);
      
      // Broadcast to all players that a card was played
      io.to(gameId).emit('cardPlayed', {
        playerId,
        card
      });
    });
  
    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);
      
      // Check if this socket was associated with a player in a game
      const playerData = socketPlayerMap[socket.id];
      if (playerData) {
        const { gameId, playerId, playerName } = playerData;
        
        logger.info(`Player ${playerName} (${playerId}) disconnected from game ${gameId}`);
        
        // Get the game from SQLite
        const currentGame = await GameService.findGame(gameId);
        
        if (currentGame) {
          // Check if the game is active, if so pause it
          if (currentGame.status === 'active') {
            await GameService.updateGameStatus(gameId, 'paused');
            logger.info(`Game ${gameId} paused due to player ${playerName} disconnecting`);
            
            // Notify other players that the game is paused
            socket.to(gameId).emit('gamePaused', {
              playerId,
              playerName,
              reason: 'player_disconnected'
            });
            
            // Set a timeout to handle if the player doesn't reconnect
            setTimeout(async () => {
              // Check if the game is still paused
              const gameCheck = await GameService.findGame(gameId);
              
              if (gameCheck && gameCheck.status === 'paused') {
                logger.info(`Player ${playerName} did not reconnect within timeout period`);
                
                // Option 1: End the game
                await GameService.updateGameStatus(gameId, 'finished');
                
                // Notify remaining players that the game has ended
                io.to(gameId).emit('gameEnded', {
                  reason: 'player_timeout',
                  playerId
                });
              }
            }, 60000); // 60-second timeout
          }
        }
        
        // Remove from socket map
        delete socketPlayerMap[socket.id];
      }
    });
  });

  // Start server
  server.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
  });
};

// Start the application
main().catch(logger.error); 