import React from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Location,
  LocationSearchResult,
  WeatherForecast,
} from '../types/weather';
import weatherService from '../services/weatherService';

export interface WeatherQueryParams {
  lat: number;
  lon: number;
  name?: string;
}

export const WEATHER_QUERY_KEYS = {
  weather: (lat: number, lon: number) =>
    ['weather', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  basicWeather: (lat: number, lon: number) =>
    ['basicWeather', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  cloudData: (lat: number, lon: number) =>
    ['cloudData', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  sunMoonData: (lat: number, lon: number) =>
    ['sunMoonData', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  locations: (query: string) => ['locations', query] as const,
} as const;

/**
 * Custom hook for fetching weather data - simplified to avoid race conditions
 */
export const useWeatherData = (params: WeatherQueryParams | null) => {
  const query = useQuery<WeatherForecast>({
    queryKey: params
      ? WEATHER_QUERY_KEYS.weather(params.lat, params.lon)
      : ['weather', 'disabled'],
    queryFn: async (): Promise<WeatherForecast> => {
      if (!params) throw new Error('No location parameters provided');

      // Fetch all data in parallel to avoid race conditions
      const [basicData, cloudData, sunMoonData] = await Promise.allSettled([
        weatherService.fetchBasicWeatherData(params.lat, params.lon),
        weatherService.fetchCloudData(params.lat, params.lon),
        weatherService.fetchSunMoonData(params.lat, params.lon),
      ]);

      // Extract successful results or null for failed ones
      const basicWeatherData =
        basicData.status === 'fulfilled' ? basicData.value : null;
      const cloudWeatherData =
        cloudData.status === 'fulfilled' ? cloudData.value : null;
      const sunMoonWeatherData =
        sunMoonData.status === 'fulfilled' ? sunMoonData.value : null;

      if (!basicWeatherData) {
        throw new Error('Basic weather data not available');
      }

      const location: Location = {
        lat: params.lat,
        lon: params.lon,
        name:
          params.name || `${params.lat.toFixed(2)}, ${params.lon.toFixed(2)}`,
      };

      return weatherService.transformMeteoblueData(
        basicWeatherData,
        location,
        cloudWeatherData,
        undefined, // No longer fetch moonlight data
        sunMoonWeatherData || undefined
      );
    },
    enabled: Boolean(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (longer cache)
    refetchOnMount: false, // Prevent unnecessary refetch on mount
    refetchOnReconnect: true, // Refetch when connection is restored
    refetchOnWindowFocus: false, // Prevent flicker on focus
    // Use placeholder data to prevent loading states
    // placeholderData: (previousData: WeatherForecast | undefined) => previousData,
    // Reduce retry attempts to prevent delays
    retry: 1,
    retryDelay: 1000,
  });

  // Show toast notification for weather data fetch errors
  React.useEffect(() => {
    if (query.error && !query.isFetching) {
      const error = query.error as Error;
      const errorMessage = error.message.includes('No API key')
        ? 'API key required to fetch weather data'
        : `Failed to fetch weather data: ${error.message}`;
      toast.error(errorMessage);
    }
  }, [query.error, query.isFetching]);

  return query;
};

/**
 * Custom hook for searching locations using TanStack Query for caching
 */
export const useLocationSearch = (query: string) => {
  const searchQuery = useQuery({
    queryKey: ['locationSearch', query.trim().toLowerCase()],
    queryFn: async ({ signal }): Promise<LocationSearchResult[]> => {
      if (!query.trim() || query.trim().length < 3) return [];
      return await weatherService.searchLocations(query, signal);
    },
    enabled: Boolean(query.trim() && query.trim().length >= 3),
    staleTime: 5 * 60 * 1000, // 5 minutes - location data doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, error: Error) => {
      // Don't retry on aborted requests or network errors
      const err = error as Error & { code?: string };
      if (
        err.name === 'AbortError' ||
        err.code === 'ERR_CANCELED' ||
        err.code === 'ECONNABORTED'
      ) {
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryDelay: 1000, // 1 second delay between retries
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Show toast notification for location search errors
  React.useEffect(() => {
    if (searchQuery.error && !searchQuery.isFetching) {
      const error = searchQuery.error as Error & { code?: string };
      // Only show toast for non-aborted location search errors
      if (
        error.name !== 'AbortError' &&
        error.code !== 'ERR_CANCELED' &&
        error.code !== 'ECONNABORTED'
      ) {
        toast.error(`Location search failed: ${error.message}`);
      }
    }
  }, [searchQuery.error, searchQuery.isFetching]);

  return searchQuery;
};
