import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import WaitingRoom from '../components/WaitingRoom';
import ActiveGamePage from './ActiveGamePage';
import {
  joinGameRoom,
  listenForCardPlayed,
  listenForPlayerJoined,
  listenForGameReady,
  disconnectSocket
} from '../services/socket';
import { getGameStatus, dealCards } from '../services/api';
import { Card as CardType, GameState } from '../types';
import './WaitingRoomPage.css';
import { isProduction } from '../utils/settings';

const POLLING_INTERVAL = 5000;

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

  // Handle page refresh or direct access
  useEffect(() => {
    if (isProduction && (!playerId || !playerName)) {
      alert('Missing player information. Redirecting to home page.');
      navigate('/');
      return;
    }
  }, [navigate, playerId, playerName]);
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      navigate('/');
    }
  };
  
  // Render waiting room if the game is still in waiting status
  if (gameState.status === 'waiting') {
    return (
      <WaitingRoom
        gameId={gameId}
        roomName={roomName}
        gameType={gameType}
        playerCount={playerCount}
        maxPlayers={maxPlayers}
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

export default GameRoomPage; 