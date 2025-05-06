import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  playCard, 
  joinGameRoom, 
  listenForPlayerJoined, 
  listenForGameReady, 
  listenForCardPlayed,
  disconnectSocket
} from '../services/socket';
import { getGameStatus, dealCards } from '../services/api';
import { Card as CardType, GameState } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const POLLING_INTERVAL = 5000;

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


// Helper function to generate a random hand of cards for testing
const generateRandomHand = (): CardType[] => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const hand: CardType[] = [];
  for (let i = 0; i < 5; i++) {
    // 15% chance to add a joker instead of a regular card
    const isJoker = Math.random() < 0.15;
    
    if (isJoker) {
      // 50% chance for Big Joker vs Small Joker
      const jokerType = Math.random() < 0.5 ? 'Big' : 'Small';
      hand.push({
        suit: 'joker',
        value: jokerType
      });
    } else {
      const randomSuit = suits[Math.floor(Math.random() * suits.length)];
      const randomValue = values[Math.floor(Math.random() * values.length)];
      hand.push({
        suit: randomSuit,
        value: randomValue
      });
    }
  }
  
  return hand;
};

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
  const [playerCount, setPlayerCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Socket connection and game setup
  useEffect(() => {
    const setupGame = async () => {
      try {
        setLoading(true);
        
        if (gameId) {
          await joinGameRoom(gameId, playerId, playerName);
        } else {
          console.error('No game ID provided');
          return;
        }
        
        // Listen for player joined events (for waiting room)
        listenForPlayerJoined((data) => {
          setPlayerCount(data.playerCount);
          setGameState(prevState => ({
            ...prevState,
            status: data.status
          }));
        });
        
        // Listen for game ready events
        listenForGameReady((data) => {
          setGameState(prevState => ({
            ...prevState,
            status: data.status
          }));
          
          // If game is ready, deal cards and set up game
          if (data.status === 'ready' && gameId) {
            setupGamePlay(gameId);
          }
        });
        
        // Listen for card played events
        listenForCardPlayed((data) => {
          const { playerId: cardPlayerId, card } = data;
          // Update game state with played card
          setGameState(prevState => ({
            ...prevState,
            playedCards: [...prevState.playedCards, { playerId: cardPlayerId, card }]
          }));
        });
        
        // Get initial game state
        const gameStatusResponse = await getGameStatus(gameId);
        
        if (gameStatusResponse.success && gameStatusResponse.game) {
          const gameData = gameStatusResponse.game;
          setPlayerCount(gameData.playerCount);
          
          // Update game state status
          setGameState(prevState => ({
            ...prevState,
            status: gameData.status
          }));
          
          // If game is ready or active, set up game play
          // if (gameData.status === 'ready' || gameData.status === 'active') {
            await setupGamePlay(gameId);
          // }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up game:', error);
        alert('Failed to set up game. Please try again.');
        navigate('/');
      }
    };
    
    // Helper function to set up game play once enough players have joined
    const setupGamePlay = async (gameId: string) => {
      try {
        // Deal cards if needed
        try {
          await dealCards(gameId);
        } catch (error) {
          // Ignore errors, as another player might have already dealt the cards
          console.log('Deal cards error (might be already dealt):', error);
        }
        
        // Simulate getting cards from the server
        // In a real implementation, you would fetch the player's hand
        const simulatedHand = generateRandomHand();
        setHand(simulatedHand);
        
        setGameState(prevState => ({
          ...prevState,
          status: 'active',
          players: Array(4).fill(0).map((_, i) => ({
            id: i === 0 ? playerId : `player-${i}`,
            name: i === 0 ? playerName : `Player ${i + 1}`
          })),
          currentPlayer: playerId // Start with the current player for simplicity
        }));
      } catch (error) {
        console.error('Error setting up game play:', error);
      }
    };
    
    if (playerId && playerName) {
      console.log('Setting up game TEST');
      setupGame();
    }
    
    // Cleanup socket connection on unmount
    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, playerName, navigate]);
  
  // Polling as backup if sockets fail
  useEffect(() => {
    let interval: number | undefined;
    
    if (isPolling && playerId && playerName && gameId) {
      interval = window.setInterval(async () => {
        try {
          const response = await getGameStatus(gameId);
          if (response.success && response.game) {
            const gameData = response.game;
            setPlayerCount(gameData.playerCount);
            
            // Update game state with status
            setGameState(prevState => ({
              ...prevState,
              status: gameData.status
            }));
            
            // If game status is ready or active, stop polling
            if (gameData.status === 'ready' || gameData.status === 'active') {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('Error polling game status:', error);
        }
      }, POLLING_INTERVAL);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [gameId, playerId, playerName, isPolling]);
  
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

    
  if (loading) {
    return (
      <div className="page loading">
        <div className="container">
          <LoadingSpinner message="Setting up the game room..." />
        </div>
      </div>
    );
  }
  
  if (!gameId) {
    return <div>Invalid game ID</div>;
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
          onClick={onLeaveGame}
          primary={false}
          className="leave-button"
        />
      </div>
    </div>
  );
};

export default ActiveGamePage; 