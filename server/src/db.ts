import { Game, Player } from './models';
import { Card, GameRoom, PlayerDB } from './types';

export class GameService {
  // Find a game by ID
  static async findGame(gameId: string): Promise<GameRoom | null> {
    try {
      const game = await Game.findByPk(gameId, {
        include: [{ model: Player }]
      });
      
      if (!game) return null;
      
      // Convert from DB model to GameRoom interface
      const gameRoom: GameRoom = {
        id: game.id,
        maxPlayers: game.maxPlayers,
        status: game.status as 'waiting' | 'ready' | 'active' | 'finished',
        createdAt: new Date(game.createdAt).getTime(),
        gameType: game.gameType as 'Tractor' | 'Red Heart Five' | 'Throwing Eggs',
        roomName: game.roomName,
        deck: JSON.parse(game.deck),
        players: game.Players ? game.Players.map((player: PlayerDB) => ({
          id: player.id,
          name: player.name,
          hand: JSON.parse(player.hand)
        })) : []
      };
      
      return gameRoom;
    } catch (error) {
      console.error('Error finding game:', error);
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
        deck: JSON.stringify(gameRoom.deck),
        createdAt: new Date(gameRoom.createdAt)
      });
      
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  }
  
  // Update a game
  static async updateGame(gameRoom: GameRoom): Promise<boolean> {
    try {
      const game = await Game.findByPk(gameRoom.id);
      
      if (!game) return false;
      
      game.status = gameRoom.status;
      game.deck = JSON.stringify(gameRoom.deck);
      
      await game.save();
      
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
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
      
      return players.map(player => ({
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