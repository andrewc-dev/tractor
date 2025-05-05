import axios from 'axios';

// Server URL - change this to match your server's address
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Game related API calls
export const createGame = async () => {
  try {
    const response = await api.post('/api/game');
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

export const getGameStatus = async (gameId) => {
  try {
    const response = await api.get(`/api/game/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting game status:', error);
    throw error;
  }
};

export const joinGame = async (gameId, playerId, playerName) => {
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

export const dealCards = async (gameId) => {
  try {
    const response = await api.post(`/api/game/${gameId}/deal`);
    return response.data;
  } catch (error) {
    console.error('Error dealing cards:', error);
    throw error;
  }
};

export default api; 