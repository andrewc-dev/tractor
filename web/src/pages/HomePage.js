import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { createGame } from '../services/api';
import { saveItem, getItem } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import './HomePage.css';

const HomePage = () => {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Handler for creating a new game
  const handleCreateGame = async () => {
    try {
      setCreating(true);
      
      // Generate a player ID or get from storage if exists
      let playerId = getItem('playerId');
      if (!playerId) {
        playerId = uuidv4();
        saveItem('playerId', playerId);
      }
      
      // Create a new game on the server
      const response = await createGame();
      
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
          
          <div className="home-actions">
            <Button 
              title="Create Game" 
              onClick={handleCreateGame} 
              loading={creating}
              className="home-button"
            />
            
            <Button 
              title="Join Game" 
              onClick={handleJoinGame} 
              primary={false}
              className="home-button"
            />
          </div>
        </div>
        
        <div className="home-footer">
          <p>© 2023 Card Game</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 