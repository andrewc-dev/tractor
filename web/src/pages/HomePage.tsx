import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import CreateGameForm from '../components/CreateGameForm';
import { createGame, GameSettings } from '../services/api';
import { saveItem, getItem } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import './HomePage.css';

const HomePage = () => {
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameType: 'Tractor',
    playerCount: 4,
    roomName: ''
  });
  const navigate = useNavigate();
  
  // Update game settings
  const updateGameSettings = (field: keyof GameSettings, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show the create game form
  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  // Handler for creating a new game
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      
      // Generate a player ID or get from storage if exists
      let playerId = getItem('playerId');
      if (!playerId) {
        playerId = uuidv4();
        saveItem('playerId', playerId);
      }
      
      // Create a new game on the server
      const response = await createGame(gameSettings);
      
      if (response.success) {
        // Navigate to the join game page
        navigate(`/join?gameId=${response.gameId}&fromCreate=true`);
      } else {
        alert('Could not create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Could not create game. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Navigate to join game page
  const handleJoinGame = () => {
    navigate('/join');
  };

  return (
    <div className="page home-page">
      <div className="container">
        <div className="home-content">
          <div className="home-header">
            <h1>Card Game</h1>
            <p className="subtitle">Multiplayer Card Game Experience</p>
          </div>
          
          {!showCreateForm ? (
            <div className="home-actions">
              <Button 
                title="Create Game" 
                onClick={handleShowCreateForm} 
                className="home-button"
              />
              
              <Button 
                title="Join Game" 
                onClick={handleJoinGame} 
                primary={false}
                className="home-button"
              />
            </div>
          ) : (
            <CreateGameForm 
              gameSettings={gameSettings}
              updateGameSettings={updateGameSettings}
              creating={creating}
              onSubmit={handleCreateGame}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>
        
        <div className="home-footer">
          <p>© 2025 Tractor Card Game</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 