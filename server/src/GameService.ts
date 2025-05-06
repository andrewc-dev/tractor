import { Game, Player, GameInstance } from './models.js';
import { Card, GameRoom, GameInstance as GameInstanceType } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class GameService {
  // Find a game by ID
  static async findGame(gameId: string): Promise<GameRoom | null> {
    try {
      const game = await Game.findByPk(gameId, {
        include: [{ model: Player }]
      });
      
      if (!game) return null;
      
      // Get player IDs for the game
      const players = await Player.findAll({ where: { gameId: game.id } });
      const playerIds = players.map((player: any) => player.id);
      
      // Convert from DB model to GameRoom interface
      const gameRoom: GameRoom = {
        id: game.id,
        maxPlayers: game.maxPlayers,
        status: game.status as 'waiting' | 'ready' | 'active' | 'finished',
        createdAt: new Date(game.createdAt).getTime(),
        gameType: game.gameType as 'Tractor' | 'Red Heart Five' | 'Throwing Eggs',
        roomName: game.roomName,
        playersList: playerIds,
        instanceId: game.instanceId || undefined
      };
      
      return gameRoom;
    } catch (error) {
      console.error('Error finding game:', error);
      return null;
    }
  }
  
  // Get game instance by ID
  static async getGameInstance(instanceId: string): Promise<GameInstanceType | null> {
    try {
      const instance = await GameInstance.findByPk(instanceId);
      
      if (!instance) return null;
      
      // Get all players for this game
      const game = await Game.findOne({ where: { instanceId: instanceId } });
      if (!game) return null;
      
      const players = await Player.findAll({ where: { gameId: game.id } });
      
      return {
        id: instance.id,
        deck: JSON.parse(instance.deck),
        currentPlayer: instance.currentPlayer,
        roundNumber: instance.roundNumber,
        gameState: JSON.parse(instance.gameState),
        players: players.map((player: any) => ({
          id: player.id,
          name: player.name,
          cards: JSON.parse(player.hand)
        }))
      };
    } catch (error) {
      console.error('Error getting game instance:', error);
      return null;
    }
  }
  
  // Create a new game
  static async createGame(gameRoom: GameRoom): Promise<boolean> {
    try {
      // Create the game record
      await Game.create({
        id: gameRoom.id,
        maxPlayers: gameRoom.maxPlayers,
        status: gameRoom.status,
        gameType: gameRoom.gameType,
        roomName: gameRoom.roomName,
        instanceId: null, // Will be created when game starts
        createdAt: new Date(gameRoom.createdAt)
      });
      
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  }
  
  // Create game instance when game becomes active
  static async createGameInstance(gameId: string, deck: Card[]): Promise<string | null> {
    try {
      const game = await Game.findByPk(gameId);
      
      if (!game) return null;
      
      // Create a new game instance
      const instanceId = uuidv4();
      await GameInstance.create({
        id: instanceId,
        deck: JSON.stringify(deck),
        currentPlayer: null,
        roundNumber: 1,
        gameState: JSON.stringify({})
      });
      
      // Update the game with the instance ID
      game.instanceId = instanceId;
      await game.save();
      
      return instanceId;
    } catch (error) {
      console.error('Error creating game instance:', error);
      return null;
    }
  }
  
  // Update a game's status
  static async updateGameStatus(gameId: string, status: 'waiting' | 'ready' | 'active' | 'paused' | 'finished'): Promise<boolean> {
    try {
      const game = await Game.findByPk(gameId);
      
      if (!game) return false;
      
      game.status = status;
      await game.save();
      
      return true;
    } catch (error) {
      console.error('Error updating game status:', error);
      return false;
    }
  }
  
  // Update game instance
  static async updateGameInstance(instanceId: string, updates: Partial<GameInstanceType>): Promise<boolean> {
    try {
      const instance = await GameInstance.findByPk(instanceId);
      
      if (!instance) return false;
      
      if (updates.deck) {
        instance.deck = JSON.stringify(updates.deck);
      }
      
      if (updates.currentPlayer !== undefined) {
        instance.currentPlayer = updates.currentPlayer;
      }
      
      if (updates.roundNumber !== undefined) {
        instance.roundNumber = updates.roundNumber;
      }
      
      if (updates.gameState) {
        instance.gameState = JSON.stringify(updates.gameState);
      }
      
      await instance.save();
      
      return true;
    } catch (error) {
      console.error('Error updating game instance:', error);
      return false;
    }
  }
  
  // Add player to game
  static async addPlayer(gameId: string, player: { id: string; name: string; hand: Card[] }): Promise<boolean> {
    try {
      // Check if player already exists in this game
      const existingPlayer = await Player.findOne({
        where: {
          id: player.id,
          gameId: gameId
        }
      });
      
      if (existingPlayer) return true; // Player already exists
      
      // Create new player
      await Player.create({
        id: player.id,
        gameId: gameId,
        name: player.name,
        hand: JSON.stringify(player.hand)
      });
      
      return true;
    } catch (error) {
      console.error('Error adding player:', error);
      return false;
    }
  }
  
  // Update player's hand
  static async updatePlayerHand(gameId: string, playerId: string, hand: Card[]): Promise<boolean> {
    try {
      const player = await Player.findOne({
        where: {
          id: playerId,
          gameId: gameId
        }
      });
      
      if (!player) return false;
      
      player.hand = JSON.stringify(hand);
      await player.save();
      
      return true;
    } catch (error) {
      console.error('Error updating player hand:', error);
      return false;
    }
  }
  
  // Get players for a game
  static async getPlayers(gameId: string): Promise<{ id: string; name: string; hand: Card[] }[]> {
    try {
      const players = await Player.findAll({
        where: { gameId: gameId }
      });
      
      return players.map((player: any) => ({
        id: player.id,
        name: player.name,
        hand: JSON.parse(player.hand)
      }));
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }
} 