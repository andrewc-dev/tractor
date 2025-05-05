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
    }
  }, [queryGameId]);
  
  // Validate form fields
  const validateForm = () => {
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
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // First, check if game exists
      try {
        await getGameStatus(gameId);
      } catch (error) {
        setGameIdError('Game not found or has expired');
        setLoading(false);
        return;
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
      
      if (response.success) {
        // Navigate to waiting room
        navigate(`/waiting/${gameId}`, {
          state: {
            playerId,
            playerName,
            playerCount: response.game.playerCount,
            maxPlayers: response.game.maxPlayers,
            status: response.game.status
          }
        });
      } else {
        alert('Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Game room is full');
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
              onChange={setGameId}
              placeholder="Enter game ID"
              error={gameIdError}
              disabled={fromCreate}
              maxLength={6}
              autoComplete="off"
              className="form-group"
            />
            
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