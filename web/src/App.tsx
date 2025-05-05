import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import HomePage from './pages/HomePage';
import JoinGamePage from './pages/JoinGamePage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import GameRoomPage from './pages/GameRoomPage';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinGamePage />} />
          <Route path="/game/:gameId" element={<GameRoomPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 