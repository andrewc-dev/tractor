import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { joinGame, getGameStatus } from '../services/api';
import { saveItem, getItem } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import './JoinGamePage.css';

// Helper function to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const JoinGamePage = () => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameIdError, setGameIdError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');
  const [gameInfo, setGameInfo] = useState<{
    gameType?: string;
    roomName?: string;
    playerCount?: number;
    maxPlayers?: number;
  } | null>(null);
  
  const navigate = useNavigate();
  const query = useQuery();
  const fromCreate = query.get('fromCreate') === 'true';
  const queryGameId = query.get('gameId');
  
  // Load initial values
  useEffect(() => {
    const loadSavedName = () => {
      const savedName = getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    };
    
    loadSavedName();
    
    if (queryGameId) {
      setGameId(queryGameId);
      // If there's a game ID in the URL, try to fetch game info
      fetchGameInfo(queryGameId);
    }
  }, [queryGameId]);

  // Fetch game information
  const fetchGameInfo = async (id: string) => {
    try {
      const statusResponse = await getGameStatus(id);
      if (statusResponse.success && statusResponse.game) {
        setGameInfo({
          gameType: statusResponse.game.gameType,
          roomName: statusResponse.game.roomName,
          playerCount: statusResponse.game.playerCount,
          maxPlayers: statusResponse.game.maxPlayers
        });
      }
    } catch (error) {
      console.error('Error fetching game info:', error);
    }
  };
  
  // When game ID changes and it's not from a URL parameter, check if the game exists
  const handleGameIdChange = async (value: string) => {
    setGameId(value);
    
    if (value.length === 6) {
      try {
        const statusResponse = await getGameStatus(value);
        if (statusResponse.success && statusResponse.game) {
          setGameInfo({
            gameType: statusResponse.game.gameType,
            roomName: statusResponse.game.roomName,
            playerCount: statusResponse.game.playerCount,
            maxPlayers: statusResponse.game.maxPlayers
          });
          setGameIdError('');
        } else {
          setGameInfo(null);
          setGameIdError('Game not found');
        }
      } catch (error) {
        setGameInfo(null);
        setGameIdError('Game not found or has expired');
      }
    } else {
      setGameInfo(null);
    }
  };
  
  // Validate form fields
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!gameId.trim()) {
      setGameIdError('Game ID is required');
      isValid = false;
    } else {
      setGameIdError('');
    }
    
    if (!playerName.trim()) {
      setPlayerNameError('Your name is required');
      isValid = false;
    } else {
      setPlayerNameError('');
    }
    
    return isValid;
  };
  
  // Handle joining a game
  const handleJoinGame = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // First, check if game exists if not already fetched
      if (!gameInfo) {
        const statusResponse = await getGameStatus(gameId);
        if (!statusResponse.success) {
          setGameIdError('Game not found or has expired');
          setLoading(false);
          return;
        }
      }
      
      // Get or generate player ID
      let playerId = getItem('playerId');
      if (!playerId) {
        playerId = uuidv4();
        saveItem('playerId', playerId);
      }
      
      // Save player name
      saveItem('playerName', playerName);
      
      // Join the game
      const response = await joinGame(gameId, playerId, playerName);
      
      if (response.success && response.game) {
        // Navigate to game room
        navigate(`/game/${gameId}`, {
          state: {
            playerId,
            playerName,
            playerCount: response.game.playerCount,
            maxPlayers: response.game.maxPlayers,
            status: response.game.status,
            gameType: response.game.gameType,
            roomName: response.game.roomName
          }
        });
      } else {
        alert('Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      if ((error as any).response?.status === 400) {
        alert((error as any).response.data.message || 'Game room is full');
      } else {
        alert('Failed to join game. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page join-page">
      <div className="container">
        <div className="join-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1>Join Game</h1>
        </div>
        
        <div className="card-container">
          <form onSubmit={handleJoinGame}>
            <Input
              label="Game ID"
              value={gameId}
              onChange={handleGameIdChange}
              placeholder="Enter game ID"
              error={gameIdError}
              disabled={fromCreate}
              maxLength={6}
              autoComplete="off"
              className="form-group"
            />
            
            {gameInfo && (
              <div className="game-info-panel">
                <h3>{gameInfo.roomName ? gameInfo.roomName : 'Game Information'}</h3>
                <p className="game-type">
                  <strong>Game Type:</strong> {gameInfo.gameType || 'Tractor'}
                </p>
                <p className="player-info">
                  <strong>Players:</strong> {gameInfo.playerCount || 0} / {gameInfo.maxPlayers || 4}
                </p>
              </div>
            )}
            
            <Input
              label="Your Name"
              value={playerName}
              onChange={setPlayerName}
              placeholder="Enter your name"
              error={playerNameError}
              maxLength={15}
              autoComplete="off"
              className="form-group"
            />
            
            <Button
              title="Join Game"
              loading={loading}
              type="submit"
              className="join-button"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage; 