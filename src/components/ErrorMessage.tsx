import React from 'react';
import { Icon } from '@iconify/react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className,
  type = 'error',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return 'mdi:alert';
      case 'info':
        return 'mdi:information';
      default:
        return 'mdi:close-circle';
    }
  };

  return (
    <div className={`error-message ${type} ${className || ''}`}>
      <div className="error-content">
        <div className="error-icon">
          <Icon icon={getIcon()} width="24" height="24" />
        </div>
        <div className="error-text">
          <h4>Oops! Something went wrong</h4>
          <p>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          className="error-retry-button"
          onClick={onRetry}
          aria-label="Retry operation"
        >
          <Icon
            icon="mdi:refresh"
            width="16"
            height="16"
            style={{ marginRight: '4px' }}
          />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
