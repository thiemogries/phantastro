import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useApiKey } from '../contexts/ApiKeyContext';
import LoadingSpinner from './LoadingSpinner';
import StarField from './StarField';
import packageJson from '../../package.json';
import './ApiKeyLogin.css';

const ApiKeyLogin: React.FC = () => {
  const { setApiKey, clearApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateApiKey = async (
    apiKey: string
  ): Promise<{ isValid: boolean; isAdBlockerIssue: boolean }> => {
    try {
      // Clean the API key before validation
      const cleanedKey = apiKey.trim().replace(/^["']|["']$/g, '');

      // Simple validation request to Meteoblue API
      const params = {
        apikey: cleanedKey,
        lat: '53.5511', // Hamburg coordinates for test
        lon: '9.9937',
        format: 'json',
      };

      const url = 'https://my.meteoblue.com/packages/basic-1h';

      const response = await axios.get(url, {
        params,
        timeout: 10000, // 10 second timeout
      });

      return {
        isValid: response.status >= 200 && response.status < 300,
        isAdBlockerIssue: false,
      };
    } catch (error) {
      // Check if this could be an ad blocker issue
      let isAdBlockerIssue = false;

      if (axios.isAxiosError(error)) {
        // Common ad blocker error patterns
        const isNetworkError =
          error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR';
        const isBlockedRequest = error.code === 'ERR_BLOCKED_BY_CLIENT';
        const isCorsError =
          error.message?.includes('CORS') ||
          error.message?.includes('Access-Control');
        const isConnectionRefused =
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('ERR_CONNECTION_REFUSED');

        // Ad blockers often cause these types of errors
        isAdBlockerIssue =
          isNetworkError ||
          isBlockedRequest ||
          isCorsError ||
          isConnectionRefused;

        console.error(
          '❌ API validation failed with status:',
          error.response?.status,
          'Code:',
          error.code,
          'Message:',
          error.message,
          'Possible ad blocker issue:',
          isAdBlockerIssue
        );
      } else {
        console.error('API key validation failed:', error);
      }

      return { isValid: false, isAdBlockerIssue };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Clean the input value
      const cleanedInput = inputValue.trim().replace(/^["']|["']$/g, '');

      // First check basic format and store
      // Note: setApiKey will show toast for format errors and throw
      setApiKey(cleanedInput);

      // Then validate with actual API call
      const { isValid, isAdBlockerIssue } = await validateApiKey(cleanedInput);

      if (isValid) {
        // The context will automatically update and WeatherApp will re-render
      } else {
        let errorMessage =
          'Invalid API key. Please check your key and try again.';

        if (isAdBlockerIssue) {
          errorMessage =
            'Network error: Unable to validate API key. This might be caused by an ad blocker or firewall. Try disabling your ad blocker or adding this site to your allowlist.';
        }

        setError(errorMessage);
        toast.error(errorMessage);
        // Clear the invalid key from storage
        clearApiKey();
      }
    } catch (error) {
      // Handle all errors from setApiKey and API validation
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid API key format';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="api-key-login">
      {/* Star Field Background */}
      <StarField animate={false} useTimeBasedRotation={true} />

      <div className="api-key-login__container">
        <div className="api-key-login__header">
          <h1>Phantastro</h1>
          <p>Astronomical Weather Forecast</p>
        </div>

        <div className="api-key-login__content">
          <p>
            To get started, you'll need a free Meteoblue API key for weather
            data.
          </p>

          <div className="api-key-login__steps">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <strong>Get your free API key</strong>
                <p>
                  Visit{' '}
                  <a
                    href="https://www.meteoblue.com/en/weather-api"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    meteoblue.com/weather-api
                  </a>{' '}
                  and sign up for a free account
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <strong>Copy your API key</strong>
                <p>Find your API key in the Meteoblue dashboard</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <strong>Enter it below</strong>
                <p>Paste your API key to start using Phantastro</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="api-key-login__form">
            <div className="form-group">
              <label htmlFor="apiKey">Meteoblue API Key</label>
              <input
                id="apiKey"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Enter your Meteoblue API key"
                disabled={isValidating}
                className={error ? 'error' : ''}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <button
              type="submit"
              disabled={isValidating || !inputValue.trim()}
              className="submit-button"
            >
              {isValidating ? (
                <>
                  <LoadingSpinner size="small" />
                  Validating...
                </>
              ) : (
                'Start Observing'
              )}
            </button>
          </form>

          <div className="api-key-login__info">
            <h3>Why do I need an API key?</h3>
            <p>
              Phantastro uses real-time weather data from Meteoblue to provide
              accurate astronomical forecasts. The API key ensures you get
              reliable, up-to-date weather information for your observations.
            </p>
            <p>
              <strong>Your API key is stored locally</strong> in your browser
              and never sent to our servers.
            </p>
          </div>
        </div>

        {/* Version Footer */}
        <footer
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            opacity: 0.7,
          }}
        >
          Phantastro v{packageJson.version}
        </footer>
      </div>
    </div>
  );
};

export default ApiKeyLogin;
