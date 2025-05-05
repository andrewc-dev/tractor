import React from 'react';
import './Input.css';

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
  id,
  className = '',
  required = false,
  error = '',
  maxLength,
  disabled = false,
  autoComplete = 'off'
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={`input-container ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'input-error' : ''}`}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      
      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
};

export default Input; 