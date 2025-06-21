import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className
}) => {
  return (
    <div className={`loading-spinner ${size} ${className || ''}`}>
      <div className="spinner-container">
        <div className="spinner">
          <div className="star star-1">⭐</div>
          <div className="star star-2">✨</div>
          <div className="star star-3">🌟</div>
          <div className="star star-4">💫</div>
        </div>
        <div className="spinner-ring"></div>
      </div>
      {message && <div className="spinner-message">{message}</div>}
    </div>
  );
};

export default LoadingSpinner;
