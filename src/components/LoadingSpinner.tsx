import React from 'react';
import { Icon } from '@iconify/react';
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
          <div className="spinner-ring"></div>
        </div>
        <div className="star star-1">
          <Icon icon="mdi:star-outline" width="16" height="16" />
        </div>
        <div className="star star-2">
          <Icon icon="mdi:sparkles" width="16" height="16" />
        </div>
        <div className="star star-3">
          <Icon icon="mdi:star" width="16" height="16" />
        </div>
        <div className="star star-4">
          <Icon icon="mdi:star-shooting" width="16" height="16" />
        </div>
      </div>
      {message && <div className="spinner-message">{message}</div>}
    </div>
  );
};

export default LoadingSpinner;
