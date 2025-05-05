import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { playCard } from '../services/socket';
import { Card as CardType, GameState } from '../types';

interface ActiveGamePageProps {
  gameId: string;
  playerId: string;
  playerName: string;
  gameState: GameState;
  hand: CardType[];
  setHand: React.Dispatch<React.SetStateAction<CardType[]>>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onLeaveGame: () => void;
}

const ActiveGamePage: React.FC<ActiveGamePageProps> = ({
  gameId,
  playerId,
  playerName,
  gameState,
  hand,
  setHand,
  setGameState,
  onLeaveGame
}) => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  
  // Handle playing a card
  const handlePlayCard = () => {
    if (!selectedCard || !gameId) {
      alert('Please select a card to play.');
      return;
    }
    
    // Play the card via socket
    playCard(gameId, playerId, selectedCard);
    
    // Update local state
    setHand(hand.filter(card => 
      !(card.suit === selectedCard.suit && card.value === selectedCard.value)
    ));
    
    setGameState(prevState => ({
      ...prevState,
      playedCards: [...prevState.playedCards, { playerId, card: selectedCard }]
    }));
    
    // Reset selected card
    setSelectedCard(null);
  };
  
  return (
    <div className="page game-page">
      <div className="game-header">
        <h1>Game Room: {gameId}</h1>
      </div>
      
      <div className="game-content">
        <div className="game-section players-section">
          <h2>Players</h2>
          <div className="players-list">
            {gameState.players.map((player) => (
              <div 
                key={player.id} 
                className={`player-item ${player.id === gameState.currentPlayer ? 'current-player' : ''}`}
              >
                <span className="player-name">
                  {player.name} {player.id === playerId ? '(You)' : ''}
                </span>
                {player.id === playerId && (
                  <span className="cards-count">{hand.length} cards</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="game-section played-cards-section">
          <h2>Played Cards</h2>
          <div className="played-cards">
            {gameState.playedCards.length === 0 ? (
              <p className="no-cards-text">No cards played yet</p>
            ) : (
              gameState.playedCards.slice(-4).map((playedCard, index) => (
                <Card 
                  key={`played-${playedCard.card.suit}-${playedCard.card.value}-${index}`}
                  card={playedCard.card}
                  disabled={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="hand-section">
        <h2>Your Hand</h2>
        <div className="hand">
          {hand.map((card, index) => (
            <Card
              key={`${card.suit}-${card.value}-${index}`}
              card={card}
              onClick={() => setSelectedCard(card)}
              className={selectedCard && 
                selectedCard.suit === card.suit && 
                selectedCard.value === card.value ? 'selected-card' : ''}
            />
          ))}
        </div>
      </div>
      
      <div className="game-actions">
        <Button
          title="Play Card"
          onClick={handlePlayCard}
          disabled={!selectedCard}
          className="play-button"
        />
        
        <Button
          title="Leave Game"
          onClick={onLeaveGame}
          primary={false}
          className="leave-button"
        />
      </div>
    </div>
  );
};

export default ActiveGamePage; 