import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  initializeSocket,
  joinGameRoom,
  listenForCardPlayed,
  playCard,
  disconnectSocket
} from '../services/socket';
import { getGameStatus, dealCards } from '../services/api';
import './GamePage.css';

const GamePage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const location = useLocation();
  
  // Get state from location or use defaults
  const { playerId = '', playerName = '' } = location.state || {};
  
  const [gameState, setGameState] = useState({
    status: 'waiting',
    players: [],
    currentPlayer: null,
    playedCards: []
  });
  const [hand, setHand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Handle page refresh or direct access
  useEffect(() => {
    if (!playerId || !playerName) {
      alert('Missing player information. Redirecting to home page.');
      navigate('/');
      return;
    }
  }, [navigate, playerId, playerName]);
  
  // Socket connection and game setup
  useEffect(() => {
    const setupGame = async () => {
      try {
        setLoading(true);
        
        // Initialize socket connection
        await initializeSocket();
        await joinGameRoom(gameId, playerId, playerName);
        
        // Listen for card played events
        listenForCardPlayed((data) => {
          const { playerId: cardPlayerId, card } = data;
          // Update game state with played card
          setGameState(prevState => ({
            ...prevState,
            playedCards: [...prevState.playedCards, { playerId: cardPlayerId, card }]
          }));
        });
        
        // Get initial game state and check if we need to deal cards
        const gameStatusResponse = await getGameStatus(gameId);
        
        if (gameStatusResponse.success) {
          if (gameStatusResponse.game.status === 'ready') {
            // Game is ready but cards haven't been dealt
            // First player to reach this point will deal the cards
            try {
              await dealCards(gameId);
            } catch (error) {
              // Ignore errors, as another player might have already dealt the cards
              console.log('Deal cards error (might be already dealt):', error);
            }
          }
          
          // Simulate getting cards from the server
          // In a real implementation, you would fetch the player's hand
          // For now, we'll simulate with random cards
          const simulatedHand = generateRandomHand();
          setHand(simulatedHand);
          
          setGameState(prevState => ({
            ...prevState,
            status: 'active',
            players: Array(4).fill().map((_, i) => ({
              id: i === 0 ? playerId : `player-${i}`,
              name: i === 0 ? playerName : `Player ${i + 1}`
            })),
            currentPlayer: playerId // Start with the current player for simplicity
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up game:', error);
        alert('Failed to set up game. Please try again.');
        navigate('/');
      }
    };
    
    if (playerId && playerName) {
      setupGame();
    }
    
    // Cleanup socket connection on unmount
    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, playerName, navigate]);
  
  // Handle playing a card
  const handlePlayCard = () => {
    if (!selectedCard) {
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
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      navigate('/');
    }
  };
  
  if (loading) {
    return (
      <div className="page game-page loading">
        <div className="container">
          <LoadingSpinner message="Setting up the game..." />
        </div>
      </div>
    );
  }
  
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
          onClick={handleLeaveGame}
          primary={false}
          className="leave-button"
        />
      </div>
    </div>
  );
};

// Helper function to generate a random hand of cards for testing
const generateRandomHand = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const hand = [];
  for (let i = 0; i < 5; i++) {
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    hand.push({
      suit: randomSuit,
      value: randomValue
    });
  }
  
  return hand;
};

export default GamePage; 