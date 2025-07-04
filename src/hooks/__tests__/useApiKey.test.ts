import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useApiKey, ApiKeyProvider } from '../../contexts/ApiKeyContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ApiKeyProvider, null, children);

describe('useApiKey', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with null when no stored API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });
    const { apiKey } = result.current;

    expect(apiKey).toBeNull();
  });

  it('should store and retrieve valid API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    const testApiKey = 'valid_api_key_12345';

    act(() => {
      const { setApiKey } = result.current;
      setApiKey(testApiKey);
    });

    const { apiKey } = result.current;
    expect(apiKey).toBe(testApiKey);
  });

  it('should reject invalid API key format', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    act(() => {
      const { setApiKey } = result.current;
      expect(() => setApiKey('short')).toThrow('Invalid API key format');
    });

    const { apiKey } = result.current;
    expect(apiKey).toBeNull();
  });

  it('should reject placeholder API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    act(() => {
      const { setApiKey } = result.current;
      expect(() => setApiKey('your_meteoblue_api_key_here')).toThrow(
        'Invalid API key format'
      );
    });

    const { apiKey } = result.current;
    expect(apiKey).toBeNull();
  });

  it('should clear API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    const testApiKey = 'valid_api_key_12345';

    act(() => {
      const { setApiKey } = result.current;
      setApiKey(testApiKey);
    });

    act(() => {
      const { clearApiKey } = result.current;
      clearApiKey();
    });

    const { apiKey } = result.current;
    expect(apiKey).toBeNull();
  });

  it('should persist API key across hook instances', () => {
    const testApiKey = 'valid_api_key_12345';

    // First hook instance
    const { result: result1 } = renderHook(() => useApiKey(), { wrapper });

    act(() => {
      const { setApiKey } = result1.current;
      setApiKey(testApiKey);
    });

    // Second hook instance (simulating page reload)
    const { result: result2 } = renderHook(() => useApiKey(), { wrapper });
    const { apiKey } = result2.current;

    expect(apiKey).toBe(testApiKey);
  });
});
