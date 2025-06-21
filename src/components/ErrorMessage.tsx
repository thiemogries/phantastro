import React from 'react';
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
  type = 'error'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  };

  return (
    <div className={`error-message ${type} ${className || ''}`}>
      <div className="error-content">
        <div className="error-icon">{getIcon()}</div>
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
          🔄 Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
