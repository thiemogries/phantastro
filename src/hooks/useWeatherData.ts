import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WeatherForecast, LocationSearchResult, ObservingConditions } from '../types/weather';
import weatherService from '../services/weatherService';

export interface WeatherQueryParams {
  lat: number;
  lon: number;
  locationName?: string;
}

export const WEATHER_QUERY_KEYS = {
  weather: (lat: number, lon: number) => ['weather', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  locations: (query: string) => ['locations', query] as const,
  observingConditions: (forecast: WeatherForecast) => ['observingConditions', forecast.lastUpdated] as const,
} as const;

/**
 * Custom hook for fetching weather data with TanStack Query
 */
export const useWeatherData = (params: WeatherQueryParams | null) => {
  return useQuery<WeatherForecast>({
    queryKey: params ? WEATHER_QUERY_KEYS.weather(params.lat, params.lon) : ['weather', 'disabled'],
    queryFn: async (): Promise<WeatherForecast> => {
      if (!params) throw new Error('No location parameters provided');
      console.log('🌍 Fetching weather data for:', params);
      const startTime = Date.now();
      const result = await weatherService.getWeatherForecast(params.lat, params.lon, params.locationName);
      const loadTime = Date.now() - startTime;
      console.log(`✅ Weather data loaded successfully in ${loadTime}ms`);
      return result;
    },
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on API key errors
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Custom hook for searching locations
 */
export const useLocationSearch = () => {
  return useMutation({
    mutationFn: async (query: string): Promise<LocationSearchResult[]> => {
      if (!query.trim()) return [];
      console.log('🔍 Searching locations for:', query);
      const results = await weatherService.searchLocations(query);
      console.log('📍 Found locations:', results.length);
      return results;
    },
    retry: 1,
  });
};

/**
 * Custom hook for calculating observing conditions
 */
export const useObservingConditions = (forecast: WeatherForecast | undefined | null) => {
  return useQuery<ObservingConditions | null>({
    queryKey: forecast ? WEATHER_QUERY_KEYS.observingConditions(forecast) : ['observingConditions', 'disabled'],
    queryFn: (): ObservingConditions | null => {
      if (!forecast?.currentWeather) return null;

      console.log('🔭 Calculating observing conditions for current weather:', {
        temperature: forecast.currentWeather.temperature,
        windSpeed: forecast.currentWeather.windSpeed,
        cloudCover: forecast.currentWeather.cloudCover.totalCloudCover,
        precipitation: forecast.currentWeather.precipitation.precipitation
      });

      const conditions = weatherService.calculateObservingConditions(forecast.currentWeather);
      console.log('✨ Observing conditions calculated:', conditions);
      return conditions;
    },
    enabled: !!forecast?.currentWeather,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for API key validation
 */
export const useValidateApiKey = () => {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      console.log('🔑 Validating API key...');
      const isValid = await weatherService.validateApiKey();
      console.log('🔑 API key validation result:', isValid);
      return isValid;
    },
    retry: false,
  });
};

/**
 * Custom hook for refreshing weather data
 */
export const useRefreshWeatherData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: WeatherQueryParams) => {
      console.log('🔄 Refreshing weather data for:', params);
      // Invalidate and refetch the specific weather query
      await queryClient.invalidateQueries({
        queryKey: WEATHER_QUERY_KEYS.weather(params.lat, params.lon)
      });
      return params;
    },
    onSuccess: (params) => {
      console.log('✅ Weather data refresh initiated for:', params);
    },
    onError: (error) => {
      console.error('❌ Weather data refresh failed:', error);
    },
  });
};

/**
 * Custom hook for getting weather request stats
 */
export const useWeatherStats = () => {
  return useQuery({
    queryKey: ['weatherStats'],
    queryFn: () => weatherService.getRequestStats(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
  });
};

/**
 * Helper hook to prefetch weather data for a location
 */
export const usePrefetchWeatherData = () => {
  const queryClient = useQueryClient();

  return (params: WeatherQueryParams) => {
    queryClient.prefetchQuery({
      queryKey: WEATHER_QUERY_KEYS.weather(params.lat, params.lon),
      queryFn: () => weatherService.getWeatherForecast(params.lat, params.lon, params.locationName),
      staleTime: 5 * 60 * 1000,
    });
  };
};
