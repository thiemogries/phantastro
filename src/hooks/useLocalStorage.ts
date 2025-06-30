import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for managing local storage with TypeScript support
 * Handles JSON serialization/deserialization and provides error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage is not available, using initial value');
        return initialValue;
      }

      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      if (item === null) {
        return initialValue;
      }

      const parsed = JSON.parse(item);
      console.log(`📦 useLocalStorage: Loaded ${key} from localStorage:`, parsed);
      return parsed;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        console.log(`💾 useLocalStorage: Saved ${key} to localStorage:`, valueToStore);
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          console.log(`🔄 useLocalStorage: External change detected for ${key}:`, newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing external localStorage change for "${key}":`, error);
        }
      }
    };

    // Only add listener if localStorage is available
    if (typeof window !== 'undefined' && window.localStorage) {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
