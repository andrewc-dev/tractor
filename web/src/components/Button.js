import React from 'react';
import './Button.css';

const Button = ({ 
  title, 
  onClick, 
  className = '', 
  loading = false,
  disabled = false,
  primary = true,
  type = 'button'
}) => {
  const buttonClasses = [
    'button',
    primary ? 'button-primary' : 'button-secondary',
    disabled ? 'button-disabled' : '',
    loading ? 'button-loading' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        title
      )}
    </button>
  );
};

export default Button; 