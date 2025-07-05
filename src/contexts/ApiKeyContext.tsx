import React, { createContext, useContext, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const API_KEY_STORAGE_KEY = 'phantastro-api-key';

/**
 * Validates that an API key has a reasonable format
 * Meteoblue API keys are typically alphanumeric strings
 */
function isValidApiKeyFormat(apiKey: string): boolean {
  // Basic validation: non-empty string with reasonable length
  return (
    apiKey.trim().length > 0 &&
    apiKey.trim().length >= 10 && // Minimum reasonable length
    apiKey.trim() !== 'your_meteoblue_api_key_here'
  );
}

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  isValidKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: React.ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [storedApiKey, setStoredApiKey] = useLocalStorage<string | null>(
    API_KEY_STORAGE_KEY,
    null
  );

  // Validate stored API key
  const isValidKey = storedApiKey ? isValidApiKeyFormat(storedApiKey) : false;
  const validApiKey = isValidKey ? storedApiKey : null;

  const setApiKey = useCallback(
    (apiKey: string) => {
      // Clean the API key: trim whitespace and remove any surrounding quotes
      const cleanedKey = apiKey.trim().replace(/^["']|["']$/g, '');
      if (isValidApiKeyFormat(cleanedKey)) {
        setStoredApiKey(cleanedKey);
      } else {
        throw new Error(
          'Invalid API key format. Please check your key and try again.'
        );
      }
    },
    [setStoredApiKey]
  );

  const clearApiKey = useCallback(() => {
    setStoredApiKey(null);
  }, [setStoredApiKey]);

  const value: ApiKeyContextType = {
    apiKey: validApiKey,
    setApiKey,
    clearApiKey,
    isValidKey,
  };

  return (
    <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
