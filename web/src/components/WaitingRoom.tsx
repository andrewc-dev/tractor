import React from 'react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import '../pages/WaitingRoomPage.css';

interface WaitingRoomProps {
  gameId: string;
  roomName?: string;
  gameType?: string;
  playerCount: number;
  maxPlayers: number;
  onLeaveGame: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  gameId,
  roomName = '',
  gameType = 'Tractor',
  playerCount,
  maxPlayers,
  onLeaveGame
}) => {
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

  return (
    <div className="page waiting-page">
      <div className="container">
        <div className="waiting-header">
          <button className="back-button" onClick={onLeaveGame}>
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

export default WaitingRoom; 