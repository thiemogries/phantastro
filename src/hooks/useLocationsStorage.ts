import { useCallback } from 'react';
import { WeatherQueryParams } from './useWeatherData';
import useLocalStorage from './useLocalStorage';

const LOCATIONS_STORAGE_KEY = 'phantastro-locations';

/**
 * Validates that a location object has the required properties
 */
function isValidLocation(location: any): location is WeatherQueryParams {
  return (
    typeof location === 'object' &&
    location !== null &&
    typeof location.lat === 'number' &&
    typeof location.lon === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lon) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lon >= -180 &&
    location.lon <= 180 &&
    (location.name === undefined || typeof location.name === 'string')
  );
}

/**
 * Validates and filters an array of locations
 */
function validateLocations(locations: any): WeatherQueryParams[] {
  if (!Array.isArray(locations)) {
    console.warn('Stored locations is not an array, returning empty array');
    return [];
  }

  const validLocations = locations.filter((location, index) => {
    const isValid = isValidLocation(location);
    if (!isValid) {
      console.warn(`Invalid location at index ${index}, skipping:`, location);
    }
    return isValid;
  });

  if (validLocations.length !== locations.length) {
    console.warn(`Filtered out ${locations.length - validLocations.length} invalid locations`);
  }

  return validLocations;
}

/**
 * Hook for managing locations in local storage
 * Provides validation and type safety for WeatherQueryParams[]
 */
export function useLocationsStorage(): [
  WeatherQueryParams[],
  (locations: WeatherQueryParams[] | ((prev: WeatherQueryParams[]) => WeatherQueryParams[])) => void,
  () => void
] {
  const [storedLocations, setStoredLocations] = useLocalStorage<WeatherQueryParams[]>(
    LOCATIONS_STORAGE_KEY,
    []
  );

  // Validate stored locations on every access
  const validatedLocations = validateLocations(storedLocations);

  // If validation removed some locations, update storage
  if (validatedLocations.length !== storedLocations.length) {
    setStoredLocations(validatedLocations);
  }

  const setLocations = useCallback((
    locations: WeatherQueryParams[] | ((prev: WeatherQueryParams[]) => WeatherQueryParams[])
  ) => {
    const newLocations = typeof locations === 'function' 
      ? locations(validatedLocations) 
      : locations;
    
    const validatedNewLocations = validateLocations(newLocations);
    setStoredLocations(validatedNewLocations);
  }, [validatedLocations, setStoredLocations]);

  const clearLocations = useCallback(() => {
    console.log('🗑️ useLocationsStorage: Clearing all stored locations');
    setStoredLocations([]);
  }, [setStoredLocations]);

  return [validatedLocations, setLocations, clearLocations];
}
