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
  basicWeather: (lat: number, lon: number) => ['basicWeather', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  cloudData: (lat: number, lon: number) => ['cloudData', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  locations: (query: string) => ['locations', query] as const,
  observingConditions: (forecast: WeatherForecast) => ['observingConditions', forecast.lastUpdated] as const,
} as const;

/**
 * Custom hook for fetching weather data with separate cloud data caching
 */
export const useWeatherData = (params: WeatherQueryParams | null) => {
  // Use separate queries for basic weather and cloud data
  const basicWeatherQuery = useBasicWeatherData(params);
  const cloudDataQuery = useCloudData(params);

  return useQuery<WeatherForecast>({
    queryKey: params ? WEATHER_QUERY_KEYS.weather(params.lat, params.lon) : ['weather', 'disabled'],
    queryFn: async (): Promise<WeatherForecast> => {
      if (!params) throw new Error('No location parameters provided');

      const basicData = basicWeatherQuery.data;
      const cloudData = cloudDataQuery.data;

      if (!basicData) throw new Error('Basic weather data not available');

      console.log('🔄 Combining weather data for:', params);

      const location = {
        lat: params.lat,
        lon: params.lon,
        name: params.locationName || `${params.lat.toFixed(2)}, ${params.lon.toFixed(2)}`,
        timezone: basicData.metadata?.timezone_abbreviation,
      };

      const result = weatherService.transformMeteoblueData(basicData, location, cloudData);
      console.log('✅ Weather data combined successfully');
      return result;
    },
    enabled: !!params && basicWeatherQuery.isSuccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Custom hook for fetching basic weather data independently
 */
export const useBasicWeatherData = (params: WeatherQueryParams | null) => {
  return useQuery<any>({
    queryKey: params ? WEATHER_QUERY_KEYS.basicWeather(params.lat, params.lon) : ['basicWeather', 'disabled'],
    queryFn: async (): Promise<any> => {
      if (!params) throw new Error('No location parameters provided');
      console.log('🌍 Fetching basic weather data for:', params);
      const startTime = Date.now();
      const result = await weatherService.fetchBasicWeatherData(params.lat, params.lon);
      const loadTime = Date.now() - startTime;
      console.log(`✅ Basic weather data loaded successfully in ${loadTime}ms`);
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
 * Custom hook for fetching cloud data independently (for advanced use cases)
 */
export const useCloudData = (params: WeatherQueryParams | null) => {
  return useQuery<any>({
    queryKey: params ? WEATHER_QUERY_KEYS.cloudData(params.lat, params.lon) : ['cloudData', 'disabled'],
    queryFn: async (): Promise<any> => {
      if (!params) throw new Error('No location parameters provided');
      console.log('☁️ Fetching cloud data for:', params);
      const startTime = Date.now();
      const result = await weatherService.fetchCloudData(params.lat, params.lon);
      const loadTime = Date.now() - startTime;
      console.log(`✅ Cloud data loaded successfully in ${loadTime}ms`);
      return result;
    },
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Be more lenient with cloud data since it's supplementary
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
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
      // Invalidate and refetch all related queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.basicWeather(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.cloudData(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.weather(params.lat, params.lon)
        })
      ]);
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
    // Prefetch both basic weather and cloud data separately
    queryClient.prefetchQuery({
      queryKey: WEATHER_QUERY_KEYS.basicWeather(params.lat, params.lon),
      queryFn: () => weatherService.fetchBasicWeatherData(params.lat, params.lon),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: WEATHER_QUERY_KEYS.cloudData(params.lat, params.lon),
      queryFn: () => weatherService.fetchCloudData(params.lat, params.lon),
      staleTime: 5 * 60 * 1000,
    });
  };
};
