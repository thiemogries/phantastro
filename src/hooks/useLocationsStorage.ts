import { useCallback } from 'react';
import { WeatherQueryParams } from './useWeatherData';
import useLocalStorage from './useLocalStorage';

const LOCATIONS_STORAGE_KEY = 'phantastro-locations';

/**
 * Validates that a location object has the required properties
 */
function isValidLocation(location: unknown): location is WeatherQueryParams {
  const loc = location as any;
  return (
    typeof location === 'object' &&
    location !== null &&
    typeof loc.lat === 'number' &&
    typeof loc.lon === 'number' &&
    !isNaN(loc.lat) &&
    !isNaN(loc.lon) &&
    loc.lat >= -90 &&
    loc.lat <= 90 &&
    loc.lon >= -180 &&
    loc.lon <= 180 &&
    (loc.name === undefined || typeof loc.name === 'string')
  );
}

/**
 * Validates and filters an array of locations
 */
function validateLocations(locations: unknown): WeatherQueryParams[] {
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
    console.warn(
      `Filtered out ${locations.length - validLocations.length} invalid locations`
    );
  }

  return validLocations;
}

/**
 * Hook for managing locations in local storage
 * Provides validation and type safety for WeatherQueryParams[]
 */
export function useLocationsStorage(): [
  WeatherQueryParams[],
  (
    locations:
      | WeatherQueryParams[]
      | ((prev: WeatherQueryParams[]) => WeatherQueryParams[])
  ) => void,
  () => void,
] {
  const [storedLocations, setStoredLocations] = useLocalStorage<
    WeatherQueryParams[]
  >(LOCATIONS_STORAGE_KEY, []);

  // Validate stored locations on every access
  const validatedLocations = validateLocations(storedLocations);

  // If validation removed some locations, update storage
  if (validatedLocations.length !== storedLocations.length) {
    setStoredLocations(validatedLocations);
  }

  const setLocations = useCallback(
    (
      locations:
        | WeatherQueryParams[]
        | ((prev: WeatherQueryParams[]) => WeatherQueryParams[])
    ) => {
      const newLocations =
        typeof locations === 'function'
          ? locations(validatedLocations)
          : locations;

      const validatedNewLocations = validateLocations(newLocations);
      setStoredLocations(validatedNewLocations);
    },
    [validatedLocations, setStoredLocations]
  );

  const clearLocations = useCallback(() => {
    setStoredLocations([]);
  }, [setStoredLocations]);

  return [validatedLocations, setLocations, clearLocations];
}
