import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import WaitingRoom from '../components/WaitingRoom';
import ActiveGamePage from './ActiveGamePage';
import {
  initializeSocket,
  joinGameRoom,
  listenForCardPlayed,
  listenForPlayerJoined,
  listenForGameReady,
  disconnectSocket
} from '../services/socket';
import { getGameStatus, dealCards } from '../services/api';
import { Card as CardType, GameState } from '../types';
import './WaitingRoomPage.css';

interface LocationState {
  playerId: string;
  playerName: string;
  gameType?: string;
  roomName?: string;
  playerCount?: number;
  maxPlayers?: number;
}

const GameRoomPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const location = useLocation();
  
  // Get state from location or use defaults
  const { 
    playerId = '', 
    playerName = '',
    gameType = 'Tractor',
    roomName = '',
    playerCount: initialPlayerCount = 1,
    maxPlayers: initialMaxPlayers = 4
  } = (location.state as LocationState) || {};
  
  // Game state
  const [gameState, setGameState] = useState({
    status: 'waiting',
    players: [],
    currentPlayer: null,
    playedCards: []
  } as GameState);
  
  // Waiting room state
  const [playerCount, setPlayerCount] = useState(initialPlayerCount);
  const [maxPlayers] = useState(initialMaxPlayers);
  const [isPolling, setIsPolling] = useState(true);
  
  // Game play state
  const [hand, setHand] = useState([] as CardType[]);
  const [loading, setLoading] = useState(true);
  
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
        if (gameId) {
          await joinGameRoom(gameId, playerId, playerName);
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
        if (gameId) {
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
            if (gameData.status === 'ready' || gameData.status === 'active') {
              await setupGamePlay(gameId);
            }
          }
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
      }, 5000);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [gameId, playerId, playerName, isPolling]);
  
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
  
  // Render waiting room if the game is still in waiting status
  if (gameState.status === 'waiting') {
    return (
      <WaitingRoom
        gameId={gameId}
        roomName={roomName}
        gameType={gameType}
        playerCount={playerCount}
        maxPlayers={maxPlayers}
        onShareGame={handleShareGame}
        onLeaveGame={handleLeaveGame}
      />
    );
  }
  
  // Render active game if the game is ready or active
  return (
    <ActiveGamePage
      gameId={gameId}
      playerId={playerId}
      playerName={playerName}
      gameState={gameState}
      hand={hand}
      setHand={setHand}
      setGameState={setGameState}
      onLeaveGame={handleLeaveGame}
    />
  );
};

// Helper function to generate a random hand of cards for testing
const generateRandomHand = (): CardType[] => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const hand: CardType[] = [];
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

export default GameRoomPage; 