import axios, { AxiosInstance } from 'axios';
import { ApiResponse, Game } from '../types';
import { QueryOptions, useQuery } from '@tanstack/react-query';

// Server URL - change this to match your server's address
export const API_URL = 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

type GamePayload = { game: Game };

// Game settings interface
export interface GameSettings {
  gameType: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  playerCount: 4 | 6;
  roomName?: string;
}

// Game related API calls
export const createGame = async (settings: GameSettings): Promise<ApiResponse<{ gameId: string; link: string }>> => {
  try {
    const response = await api.post('/api/game', settings);
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

export const getGameStatus = async (gameId: string): Promise<ApiResponse<GamePayload>> => {
  try {
    const response = await api.get(`/api/game/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting game status:', error);
    throw error;
  }
};

export const useGetGameStatusPolling = (gameId: string, callback?: (data: ApiResponse<GamePayload>) => void, options: QueryOptions<ApiResponse<GamePayload>> = {}) => {
  return useQuery({
    ...options,
    queryKey: ['gameStatus', gameId],
    queryFn: () => {
      const response = getGameStatus(gameId)
      response.then(data => callback?.(data));
      return response;
    },
    enabled: !!gameId,
    refetchInterval: 5000,
  });
};

export const joinGame = async (gameId: string, playerId: string, playerName: string): Promise<ApiResponse<GamePayload>> => {
  try {
    const response = await api.post(`/api/game/${gameId}/join`, {
      playerId,
      playerName
    });
    return response.data;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

export const dealCards = async (gameId: string): Promise<ApiResponse<GamePayload>> => {
  try {
    const response = await api.post(`/api/game/${gameId}/deal`);
    return response.data;
  } catch (error) {
    console.error('Error dealing cards:', error);
    throw error;
  }
};

export default api; 