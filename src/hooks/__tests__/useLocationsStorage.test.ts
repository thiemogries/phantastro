import { renderHook, act } from '@testing-library/react';
import { useLocationsStorage } from '../useLocationsStorage';
import { WeatherQueryParams } from '../useWeatherData';

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

describe('useLocationsStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty array when no stored data', () => {
    const { result } = renderHook(() => useLocationsStorage());
    const [locations] = result.current;

    expect(locations).toEqual([]);
  });

  it('should store and retrieve locations', () => {
    const { result } = renderHook(() => useLocationsStorage());

    const testLocations: WeatherQueryParams[] = [
      { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
      { lat: 40.7128, lon: -74.006, name: 'New York, USA' },
    ];

    act(() => {
      const [, setLocations] = result.current;
      setLocations(testLocations);
    });

    const [locations] = result.current;
    expect(locations).toEqual(testLocations);
  });

  it('should persist locations across hook instances', () => {
    const testLocations: WeatherQueryParams[] = [
      { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
    ];

    // First hook instance
    const { result: result1 } = renderHook(() => useLocationsStorage());

    act(() => {
      const [, setLocations] = result1.current;
      setLocations(testLocations);
    });

    // Second hook instance (simulating page reload)
    const { result: result2 } = renderHook(() => useLocationsStorage());
    const [locations] = result2.current;

    expect(locations).toEqual(testLocations);
  });

  it('should validate location data and filter invalid entries', () => {
    // Manually set invalid data in localStorage
    localStorageMock.setItem(
      'phantastro-locations',
      JSON.stringify([
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' }, // valid
        { lat: 'invalid', lon: 9.9937, name: 'Invalid' }, // invalid lat
        { lat: 91, lon: 9.9937, name: 'Invalid' }, // invalid lat range
        { lat: 53.5511, lon: 181, name: 'Invalid' }, // invalid lon range
        { lat: 40.7128, lon: -74.006 }, // valid without name
      ])
    );

    const { result } = renderHook(() => useLocationsStorage());
    const [locations] = result.current;

    // Should only have the 2 valid locations
    expect(locations).toHaveLength(2);
    expect(locations[0]).toEqual({
      lat: 53.5511,
      lon: 9.9937,
      name: 'Hamburg, Germany',
    });
    expect(locations[1]).toEqual({ lat: 40.7128, lon: -74.006 });
  });

  it('should clear all locations', () => {
    const { result } = renderHook(() => useLocationsStorage());

    const testLocations: WeatherQueryParams[] = [
      { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
    ];

    act(() => {
      const [, setLocations] = result.current;
      setLocations(testLocations);
    });

    act(() => {
      const [, , clearLocations] = result.current;
      clearLocations();
    });

    const [locations] = result.current;
    expect(locations).toEqual([]);
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useLocationsStorage());

    const initialLocation: WeatherQueryParams = {
      lat: 53.5511,
      lon: 9.9937,
      name: 'Hamburg, Germany',
    };

    act(() => {
      const [, setLocations] = result.current;
      setLocations([initialLocation]);
    });

    act(() => {
      const [, setLocations] = result.current;
      setLocations(prev => [
        ...prev,
        { lat: 40.7128, lon: -74.006, name: 'New York, USA' },
      ]);
    });

    const [locations] = result.current;
    expect(locations).toHaveLength(2);
    expect(locations[1].name).toBe('New York, USA');
  });
});
