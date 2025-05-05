import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { getGameStatus } from '../services/api';
import {
  initializeSocket,
  joinGameRoom,
  listenForPlayerJoined,
  listenForGameReady,
  disconnectSocket
} from '../services/socket';
import './WaitingRoomPage.css';

interface LocationState {
  playerId: string;
  playerName: string;
  playerCount?: number;
  maxPlayers?: number;
  status?: string;
  gameType?: string;
  roomName?: string;
}

interface RouteParams {
  gameId: string;
}

const WaitingRoomPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams() as RouteParams;
  const location = useLocation();
  
  // Get state from location or use defaults
  const { 
    playerId = '', 
    playerName = '', 
    playerCount: initialPlayerCount = 1,
    maxPlayers: initialMaxPlayers = 4,
    status: initialStatus = 'waiting',
    gameType = 'Tractor',
    roomName = ''
  } = (location.state as LocationState) || {};
  
  const [playerCount, setPlayerCount] = useState(initialPlayerCount);
  const [maxPlayers] = useState(initialMaxPlayers);
  const [status, setStatus] = useState(initialStatus);
  const [isPolling, setIsPolling] = useState(true);
  
  // Handle page refresh or direct access
  useEffect(() => {
    if (!playerId || !playerName) {
      alert('Missing player information. Redirecting to home page.');
      navigate('/');
      return;
    }
  }, [navigate, playerId, playerName]);
  
  // Socket connection setup
  useEffect(() => {
    const setupSocketConnection = async () => {
      try {
        await initializeSocket();
        if (gameId) {
          await joinGameRoom(gameId, playerId, playerName);
        }
        
        listenForPlayerJoined((data) => {
          setPlayerCount(data.playerCount);
          setStatus(data.status);
        });
        
        listenForGameReady((data) => {
          setStatus(data.status);
          if (data.status === 'ready' && gameId) {
            navigate(`/game/${gameId}`, {
              state: {
                playerId,
                playerName,
                gameType,
                roomName
              }
            });
          }
        });
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };
    
    if (playerId && playerName && gameId) {
      setupSocketConnection();
    }
    
    // Cleanup function
    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, playerName, navigate, gameType, roomName]);
  
  // Polling as backup if sockets fail
  useEffect(() => {
    let interval: number | undefined;
    
    if (isPolling && playerId && playerName && gameId) {
      interval = window.setInterval(async () => {
        try {
          const response = await getGameStatus(gameId);
          if (response.success && response.game) {
            setPlayerCount(response.game.playerCount);
            setStatus(response.game.status);
            
            if (response.game.status === 'ready') {
              setIsPolling(false);
              navigate(`/game/${gameId}`, {
                state: {
                  playerId,
                  playerName,
                  gameType: response.game.gameType || gameType,
                  roomName: response.game.roomName || roomName
                }
              });
            }
          }
        } catch (error) {
          console.error('Error polling game status:', error);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [gameId, playerId, playerName, navigate, isPolling, gameType, roomName]);
  
  // Handle sharing the game link
  const handleShareGame = () => {
    if (!gameId) return;
    
    const gameLink = `${window.location.origin}/join?gameId=${gameId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join my card game',
        text: `Join my card game with game ID: ${gameId}`,
        url: gameLink
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard(gameLink);
      });
    } else {
      copyToClipboard(gameLink);
    }
  };
  
  // Helper function to copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Game link copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      navigate('/');
    }
  };

  if (!gameId) {
    return <div>Invalid game ID</div>;
  }

  return (
    <div className="page waiting-page">
      <div className="container">
        <div className="waiting-header">
          <button className="back-button" onClick={handleLeaveGame}>
            ← Back
          </button>
          <h1>Waiting Room</h1>
        </div>
        
        <div className="card-container game-info">
          <h2>{roomName || `Game Room`}</h2>
          <div className="game-id">{gameId}</div>
          <div className="game-type-label">
            Game Type: <span className="game-type-value">{gameType}</span>
          </div>
          <Button 
            title="Share Invite" 
            onClick={handleShareGame}
            className="share-button"
          />
        </div>
        
        <div className="waiting-spinner">
          <LoadingSpinner message="Waiting for players to join..." />
        </div>
        
        <div className="player-status">
          <p className="player-count">{playerCount} of {maxPlayers} players joined</p>
          <div className="player-dots">
            {Array.from({ length: maxPlayers }).map((_, index) => (
              <span 
                key={index} 
                className={`player-dot ${index < playerCount ? 'player-dot-active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage; 