import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import HomePage from './pages/HomePage';
import JoinGamePage from './pages/JoinGamePage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinGamePage />} />
          <Route path="/waiting/:gameId" element={<WaitingRoomPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
