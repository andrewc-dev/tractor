import React from 'react';
import './Card.css';

const Card = ({ card, onClick, className = '', disabled = false }) => {
  if (!card) return null;
  
  const { suit, value } = card;
  
  // Define color based on suit
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const color = isRed ? '#E63946' : '#1D3557';
  
  return (
    <div 
      className={`card ${disabled ? 'card-disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="card-inner" style={{ borderColor: disabled ? '#ddd' : color }}>
        {/* Top-left corner with value and suit symbol */}
        <div className="card-corner card-corner-top">
          <div className="card-value" style={{ color }}>{value}</div>
          <div className="card-suit">{getSuitSymbol(suit, color)}</div>
        </div>
        
        {/* Center symbol */}
        <div className="card-center">
          {getSuitSymbol(suit, color, 30)}
        </div>
        
        {/* Bottom-right corner with value and suit symbol */}
        <div className="card-corner card-corner-bottom">
          <div className="card-value" style={{ color }}>{value}</div>
          <div className="card-suit">{getSuitSymbol(suit, color)}</div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get suit symbol
const getSuitSymbol = (suit, color, size = 14) => {
  let symbol = '';
  
  switch (suit) {
    case 'hearts':
      symbol = '♥';
      break;
    case 'diamonds':
      symbol = '♦';
      break;
    case 'clubs':
      symbol = '♣';
      break;
    case 'spades':
      symbol = '♠';
      break;
    default:
      symbol = '';
  }
  
  return (
    <span 
      className="suit-symbol" 
      style={{ color, fontSize: `${size}px` }}
    >
      {symbol}
    </span>
  );
};

export default Card; 