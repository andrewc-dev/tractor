import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
      <div className="loading-dots">
        <span className="dot dot-1"></span>
        <span className="dot dot-2"></span>
        <span className="dot dot-3"></span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 