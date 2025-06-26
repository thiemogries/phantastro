import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WeatherForecast, LocationSearchResult, Location } from '../types/weather';
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
  moonlightData: (lat: number, lon: number) => ['moonlightData', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  sunMoonData: (lat: number, lon: number) => ['sunMoonData', { lat: lat.toFixed(4), lon: lon.toFixed(4) }] as const,
  locations: (query: string) => ['locations', query] as const,
} as const;

/**
 * Custom hook for fetching weather data - simplified to avoid race conditions
 */
export const useWeatherData = (params: WeatherQueryParams | null) => {
  return useQuery<WeatherForecast>({
    queryKey: params ? WEATHER_QUERY_KEYS.weather(params.lat, params.lon) : ['weather', 'disabled'],
    queryFn: async (): Promise<WeatherForecast> => {
      if (!params) throw new Error('No location parameters provided');

      // Fetch all data in parallel to avoid race conditions
      const [basicData, cloudData, moonlightData, sunMoonData] = await Promise.allSettled([
        weatherService.fetchBasicWeatherData(params.lat, params.lon),
        weatherService.fetchCloudData(params.lat, params.lon),
        weatherService.fetchMoonlightData(params.lat, params.lon),
        weatherService.fetchSunMoonData(params.lat, params.lon)
      ]);

      // Extract successful results or null for failed ones
      const basicWeatherData = basicData.status === 'fulfilled' ? basicData.value : null;
      const cloudWeatherData = cloudData.status === 'fulfilled' ? cloudData.value : null;
      const moonlightWeatherData = moonlightData.status === 'fulfilled' ? moonlightData.value : null;
      const sunMoonWeatherData = sunMoonData.status === 'fulfilled' ? sunMoonData.value : null;

      if (!basicWeatherData) {
        throw new Error('Basic weather data not available');
      }

      const location: Location = {
        lat: params.lat,
        lon: params.lon,
        name: params.locationName || `${params.lat.toFixed(2)}, ${params.lon.toFixed(2)}`
      };

      const result = weatherService.transformMeteoblueData(
        basicWeatherData,
        location,
        cloudWeatherData,
        moonlightWeatherData,
        sunMoonWeatherData
      );

      return result;
    },
    enabled: Boolean(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (longer cache)
    refetchOnMount: false, // Prevent unnecessary refetch on mount
    refetchOnReconnect: true, // Refetch when connection is restored
    refetchOnWindowFocus: false, // Prevent flicker on focus
    // Use placeholder data to prevent loading states
    placeholderData: (previousData: any) => previousData,
    // Reduce retry attempts to prevent delays
    retry: 1,
    retryDelay: 1000,
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
      return await weatherService.fetchBasicWeatherData(params.lat, params.lon);
    },
    enabled: Boolean(params),
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
    // Network mode to handle offline scenarios
    networkMode: 'offlineFirst',
    // Prevent background refetching that can cause flicker
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
      return await weatherService.fetchCloudData(params.lat, params.lon);
    },
    enabled: Boolean(params),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer for supplementary data)
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: (failureCount, error) => {
      // Be more lenient with cloud data since it's supplementary
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2; // Reduced retries to prevent delay
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 15000), // Faster retries
    // Allow stale data to prevent loading delays
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Use stale data while revalidating
    placeholderData: (previousData: any) => previousData,
  });
};

/**
 * Custom hook for fetching moonlight data independently
 */
export const useMoonlightData = (params: WeatherQueryParams | null) => {
  return useQuery<any>({
    queryKey: params ? WEATHER_QUERY_KEYS.moonlightData(params.lat, params.lon) : ['moonlightData', 'disabled'],
    queryFn: async (): Promise<any> => {
      if (!params) throw new Error('No location parameters provided');
      return await weatherService.fetchMoonlightData(params.lat, params.lon);
    },
    enabled: Boolean(params),
    staleTime: 30 * 60 * 1000, // 30 minutes (moonlight changes slowly)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error) => {
      // Be lenient with moonlight data since it's supplementary
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 15000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData: any) => previousData,
  });
};

/**
 * Custom hook for fetching sun and moon rise/set data independently
 */
export const useSunMoonData = (params: WeatherQueryParams | null) => {
  return useQuery<any>({
    queryKey: params ? WEATHER_QUERY_KEYS.sunMoonData(params.lat, params.lon) : ['sunMoonData', 'disabled'],
    queryFn: async (): Promise<any> => {
      if (!params) throw new Error('No location parameters provided');
      return await weatherService.fetchSunMoonData(params.lat, params.lon);
    },
    enabled: Boolean(params),
    staleTime: 2 * 60 * 60 * 1000, // 2 hours (sun/moon times change slowly)
    gcTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: (failureCount, error) => {
      // Be lenient with sun/moon data since it's supplementary
      if (error.message.includes('API key') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 15000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData: any) => previousData,
  });
};

/**
 * Custom hook for searching locations
 */
export const useLocationSearch = () => {
  return useMutation({
    mutationFn: async (query: string): Promise<LocationSearchResult[]> => {
      if (!query.trim()) return [];
      return await weatherService.searchLocations(query);
    },
    retry: 1,
  });
};



/**
 * Custom hook for API key validation
 */
export const useValidateApiKey = () => {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      return await weatherService.validateApiKey();
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
      // Invalidate and refetch all related queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.basicWeather(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.cloudData(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.moonlightData(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.sunMoonData(params.lat, params.lon)
        }),
        queryClient.invalidateQueries({
          queryKey: WEATHER_QUERY_KEYS.weather(params.lat, params.lon)
        })
      ]);
      return params;
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
    // Prefetch basic weather, cloud data, moonlight data, and sun/moon data separately
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

    queryClient.prefetchQuery({
      queryKey: WEATHER_QUERY_KEYS.moonlightData(params.lat, params.lon),
      queryFn: () => weatherService.fetchMoonlightData(params.lat, params.lon),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: WEATHER_QUERY_KEYS.sunMoonData(params.lat, params.lon),
      queryFn: () => weatherService.fetchSunMoonData(params.lat, params.lon),
      staleTime: 60 * 60 * 1000,
    });
  };
};
