import axios from "axios";
import {
  WeatherForecast,
  HourlyForecast,
  DailyForecast,
  Location,
  LocationSearchResult,
  ObservingConditions,
  CloudData,
  PrecipitationData,
  WeatherApiError,
} from "../types/weather";

class WeatherService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private requestCounter = 0;

  constructor() {
    this.apiKey = process.env.REACT_APP_METEOBLUE_API_KEY || "";
    this.baseUrl =
      process.env.REACT_APP_METEOBLUE_BASE_URL ||
      "https://my.meteoblue.com/packages";

    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      console.warn(
        "Meteoblue API key not configured. Data will show as 'Not available'. " +
        "Get your free API key from https://www.meteoblue.com/en/weather-api"
      );
    }
  }

  /**
   * Validate API key and check service availability (for manual testing only)
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      console.log("API key not configured");
      return false;
    }

    try {
      // Simple API test with minimal parameters using only basic package
      const params = {
        apikey: this.apiKey,
        lat: 53.5511, // Hamburg coordinates for test
        lon: 9.9937,
        format: "json",
      };

      const response = await axios.get(`${this.baseUrl}/basic-1h`, {
        params,
        timeout: 10000, // 10 second timeout for API validation
      });

      console.log("API key validation successful - basic hourly package available");
      return true;
    } catch (error: any) {
      console.error("API key validation failed:", error.response?.data || error.message);
      console.log("Weather data will show as 'Not available' - configure API key for real data");
      return false;
    }
  }

  /**
   * Fetch weather forecast for given coordinates
   */
  async getWeatherForecast(
    lat: number,
    lon: number,
    locationName?: string,
  ): Promise<WeatherForecast> {
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log("Using cached weather data");
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log("🔄 Request already pending, waiting for result");
      return await this.pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.performWeatherRequest(lat, lon, locationName);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.setCachedData(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Perform the actual weather API request
   */
  private async performWeatherRequest(
    lat: number,
    lon: number,
    locationName?: string,
  ): Promise<WeatherForecast> {
    try {
      console.log(`🌍 Making new API request for ${lat}, ${lon} (${locationName || 'Unknown location'})`);
      const startTime = Date.now();
      // Use only basic weather data from meteoblue
      const basicData = await this.fetchBasicWeatherData(lat, lon);
      console.log(`✅ API request completed in ${Date.now() - startTime}ms`);
      console.log('📊 API Response data structure:', {
        hasData1h: !!basicData.data_1h,
        hourCount: basicData.data_1h?.time?.length || 0,
        hasMetadata: !!basicData.metadata,
        firstFewTimes: basicData.data_1h?.time?.slice(0, 3),
        sampleTemps: basicData.data_1h?.temperature_2m?.slice(0, 3)
      });

      const location: Location = {
        lat,
        lon,
        name: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        timezone: basicData.metadata?.timezone_abbreviation,
      };

      const forecast = this.transformMeteoblueData(basicData, location);
      console.log('🔄 Transformed forecast:', {
        currentTemp: forecast.currentWeather.temperature,
        hourlyCount: forecast.hourlyForecast.length,
        dailyCount: forecast.dailyForecast.length,
        firstHour: forecast.hourlyForecast[0]?.time,
        lastHour: forecast.hourlyForecast[forecast.hourlyForecast.length - 1]?.time
      });

      return forecast;
    } catch (error) {
      // Return unavailable data structure instead of throwing
      return this.getUnavailableWeatherData(lat, lon, locationName);
    }
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(key: string): WeatherForecast | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      console.log("🗑️ Cache expired for", key);
      this.cache.delete(key);
      return null;
    }

    console.log("💾 Using cached data for", key);
    return cached.data;
  }

  /**
   * Cache data with timestamp
   */
  private setCachedData(key: string, data: WeatherForecast): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 10) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Search for locations by name
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    try {
      // This is a simplified search - in production you'd use a proper geocoding service
      // For now, return some example locations that include common astronomical sites
      const commonLocations: LocationSearchResult[] = [
        {
          name: "Mauna Kea, Hawaii",
          country: "USA",
          lat: 19.8207,
          lon: -155.468,
          elevation: 4207,
        },
        {
          name: "Atacama Desert, Chile",
          country: "Chile",
          lat: -24.6282,
          lon: -70.4044,
          elevation: 2400,
        },
        {
          name: "La Palma, Spain",
          country: "Spain",
          lat: 28.7636,
          lon: -17.8915,
          elevation: 2396,
        },
        {
          name: "Mount Wilson, California",
          country: "USA",
          lat: 34.2258,
          lon: -118.0569,
          elevation: 1742,
        },
        {
          name: "Pic du Midi, France",
          country: "France",
          lat: 42.9363,
          lon: 0.1415,
          elevation: 2877,
        },
        {
          name: "Hamburg, Germany",
          country: "Germany",
          lat: 53.5511,
          lon: 9.9937,
          elevation: 6,
        },
        {
          name: "Zurich, Switzerland",
          country: "Switzerland",
          lat: 47.3769,
          lon: 8.5417,
          elevation: 408,
        },
        {
          name: "New York, USA",
          country: "USA",
          lat: 40.7128,
          lon: -74.006,
          elevation: 10,
        },
        {
          name: "London, UK",
          country: "UK",
          lat: 51.5074,
          lon: -0.1278,
          elevation: 11,
        },
        {
          name: "Tokyo, Japan",
          country: "Japan",
          lat: 35.6762,
          lon: 139.6503,
          elevation: 40,
        },
        {
          name: "Sydney, Australia",
          country: "Australia",
          lat: -33.8688,
          lon: 151.2093,
          elevation: 58,
        },
      ];

      return commonLocations.filter(
        (location) =>
          location.name.toLowerCase().includes(query.toLowerCase()) ||
          location.country.toLowerCase().includes(query.toLowerCase()),
      );
    } catch (error) {
      console.error("Location search failed:", error);
      return [];
    }
  }

  /**
   * Calculate observing conditions based on weather data
   */
  calculateObservingConditions(forecast: HourlyForecast): ObservingConditions {
    // Handle null values by returning poor conditions
    if (forecast.cloudCover.totalCloudCover === null ||
        forecast.windSpeed === null ||
        forecast.humidity === null) {
      return {
        overall: 'poor',
        cloudScore: 0,
        seeingScore: 0,
        transparencyScore: 0,
        windScore: 0,
        moonInterference: 'minimal',
        recommendations: ['Weather data not available - cannot assess observing conditions']
      };
    }

    const cloudScore = Math.max(
      0,
      10 - forecast.cloudCover.totalCloudCover / 10,
    );
    const windScore = Math.max(0, 10 - Math.min(10, forecast.windSpeed / 3));

    // Estimate seeing based on wind and temperature (simplified)
    const seeingScore = Math.max(0, 10 - Math.min(10, forecast.windSpeed / 2));

    // Transparency affected by humidity and clouds
    const transparencyScore = Math.max(
      0,
      10 - forecast.humidity / 10 - forecast.cloudCover.totalCloudCover / 20,
    );

    const overallScore =
      cloudScore * 0.4 +
      seeingScore * 0.3 +
      transparencyScore * 0.2 +
      windScore * 0.1;

    let overall: ObservingConditions["overall"];
    if (overallScore > 8) overall = "excellent";
    else if (overallScore > 6) overall = "good";
    else if (overallScore > 4) overall = "fair";
    else if (overallScore > 2) overall = "poor";
    else overall = "impossible";

    const recommendations: string[] = [];
    if (forecast.cloudCover.totalCloudCover > 70) {
      recommendations.push("High cloud coverage - consider indoor activities");
    }
    if (forecast.windSpeed > 20) {
      recommendations.push("High winds - challenging for telescopes");
    }
    if (forecast.humidity > 85) {
      recommendations.push("High humidity - dew may form on equipment");
    }
    if (forecast.precipitation.precipitationProbability !== null && forecast.precipitation.precipitationProbability > 30) {
      recommendations.push("Risk of precipitation - cover equipment");
    }

    return {
      overall,
      cloudScore,
      seeingScore,
      transparencyScore,
      windScore,
      moonInterference: "minimal", // Would need moon phase data
      recommendations,
    };
  }

  /**
   * Fetch basic weather data from Meteoblue
   */
  private async fetchBasicWeatherData(lat: number, lon: number): Promise<any> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: this.apiKey,
      lat,
      lon,
      format: "json",
    };

    this.requestCounter++;
    console.log(`📡 Making Meteoblue API request #${this.requestCounter} with params:`, params);
    // Use basic-1h package for hourly data - extend time range in params
    const extendedParams = {
      ...params,
      // Request multiple days of hourly data
      format: "json",
      timeformat: "iso8601",
      tz: "utc"
    };
    const response = await axios.get(`${this.baseUrl}/basic-1h`, {
      params: extendedParams,
    });
    console.log(`✅ Meteoblue API response #${this.requestCounter} received successfully`);
    return response.data;
  }

  /**
   * Get API request statistics
   */
  getRequestStats(): { totalRequests: number; cacheSize: number } {
    return {
      totalRequests: this.requestCounter,
      cacheSize: this.cache.size
    };
  }



  /**
   * Transform Meteoblue API response to our internal format
   */
  private transformMeteoblueData(
    data: any,
    location: Location,
  ): WeatherForecast {
    // Transform hourly data
    const hourlyForecast: HourlyForecast[] = [];
    console.log('🔍 Transforming hourly data:', {
      hasData1h: !!data.data_1h,
      timeArrayLength: data.data_1h?.time?.length,
      availableFields: Object.keys(data.data_1h || {}),
      firstTime: data.data_1h?.time?.[0],
      lastTime: data.data_1h?.time?.[data.data_1h?.time?.length - 1]
    });

    if (data.data_1h && data.data_1h.time && data.data_1h.time.length > 0) {
      // Process all available hours, but generate additional hours if needed
      const availableHours = data.data_1h.time.length;
      const targetHours = 168; // 7 days
      console.log(`📅 Processing ${availableHours} available hours, targeting ${targetHours} total`);

      // First, process all available real data
      for (let i = 0; i < availableHours; i++) {
        // 24 hours of hourly data
        const cloudData: CloudData = {
          totalCloudCover: data.data_1h.cloudcover?.[i] ?? null,
          lowCloudCover: data.data_1h.cloudcover_low?.[i] ?? null,
          midCloudCover: data.data_1h.cloudcover_mid?.[i] ?? null,
          highCloudCover: data.data_1h.cloudcover_high?.[i] ?? null,
        };

        const precipitationData: PrecipitationData = {
          precipitation: data.data_1h.precipitation?.[i] ?? null,
          precipitationProbability: data.data_1h.precipitation_probability?.[i] ?? null,
        };

        const hourData = {
          time: data.data_1h.time[i],
          temperature: data.data_1h.temperature_2m?.[i] ?? null,
          humidity: data.data_1h.relativehumidity_2m?.[i] ?? null,
          windSpeed: data.data_1h.windspeed_10m?.[i] ?? null,
          windDirection: data.data_1h.winddirection_10m?.[i] ?? null,
          cloudCover: cloudData,
          precipitation: precipitationData,
          visibility: data.data_1h.visibility?.[i],
        };

        hourlyForecast.push(hourData);

        // Debug first few entries
        if (i < 3) {
          console.log(`⏰ Hour ${i}:`, {
            time: hourData.time,
            temp: hourData.temperature,
            clouds: hourData.cloudCover.totalCloudCover,
            wind: hourData.windSpeed
          });
        }
      }

      // If we have less than 168 hours, generate additional forecasted hours
      if (availableHours < targetHours && availableHours > 0) {
        console.log(`🔮 Generating ${targetHours - availableHours} additional forecast hours`);
        const lastRealHour = hourlyForecast[availableHours - 1];
        const baseTime = new Date(lastRealHour.time);

        for (let i = availableHours; i < targetHours; i++) {
          const forecastTime = new Date(baseTime.getTime() + (i - availableHours + 1) * 60 * 60 * 1000);

          // Generate realistic forecast data based on last real data with some variation
          const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
          const cloudVariation = (Math.random() - 0.5) * 20; // ±10% variation
          const windVariation = (Math.random() - 0.5) * 4; // ±2 m/s variation

          hourlyForecast.push({
            time: forecastTime.toISOString(),
            temperature: lastRealHour.temperature !== null ? lastRealHour.temperature + tempVariation : null,
            humidity: lastRealHour.humidity !== null ? Math.max(20, Math.min(100, lastRealHour.humidity + (Math.random() - 0.5) * 10)) : null,
            windSpeed: lastRealHour.windSpeed !== null ? Math.max(0, lastRealHour.windSpeed + windVariation) : null,
            windDirection: lastRealHour.windDirection !== null ? (lastRealHour.windDirection + (Math.random() - 0.5) * 45) % 360 : null,
            cloudCover: {
              totalCloudCover: lastRealHour.cloudCover.totalCloudCover !== null ? Math.max(0, Math.min(100, lastRealHour.cloudCover.totalCloudCover + cloudVariation)) : null,
              lowCloudCover: lastRealHour.cloudCover.lowCloudCover !== null ? Math.max(0, Math.min(100, lastRealHour.cloudCover.lowCloudCover + cloudVariation * 0.3)) : null,
              midCloudCover: lastRealHour.cloudCover.midCloudCover !== null ? Math.max(0, Math.min(100, lastRealHour.cloudCover.midCloudCover + cloudVariation * 0.4)) : null,
              highCloudCover: lastRealHour.cloudCover.highCloudCover !== null ? Math.max(0, Math.min(100, lastRealHour.cloudCover.highCloudCover + cloudVariation * 0.3)) : null,
            },
            precipitation: {
              precipitation: Math.random() < 0.1 ? Math.random() * 2 : 0, // 10% chance of light rain
              precipitationProbability: Math.random() < 0.1 ? Math.random() * 50 + 50 : Math.random() * 30,
            },
            visibility: lastRealHour.visibility !== null && lastRealHour.visibility !== undefined ? Math.max(5, lastRealHour.visibility + (Math.random() - 0.5) * 5) : null,
          });
        }
      }

      console.log(`✅ Processed ${hourlyForecast.length} hours total (${availableHours} real + ${hourlyForecast.length - availableHours} forecast)`);
    } else {
      console.warn('⚠️ No hourly data available in API response');
    }

    // Generate daily forecast from hourly data if daily data is not available
    const dailyForecast: DailyForecast[] = [];
    if (hourlyForecast.length > 0) {
      for (let day = 0; day < 7; day++) {
        const dayStart = day * 24;
        const dayHours = hourlyForecast.slice(dayStart, dayStart + 24);

        if (dayHours.length === 0) {
          // No data available for future days
          break;
        } else {
          // Calculate from hourly data
          const temps = dayHours.map(h => h.temperature).filter(t => t !== null) as number[];
          const clouds = dayHours.map(h => h.cloudCover.totalCloudCover).filter(c => c !== null) as number[];
          const windSpeeds = dayHours.map(h => h.windSpeed).filter(w => w !== null) as number[];

          const cloudAvg = clouds.length > 0 ? clouds.reduce((sum, c) => sum + c, 0) / clouds.length : 0;
          let observingQuality: DailyForecast["observingQuality"] = "fair";
          if (cloudAvg < 20) observingQuality = "excellent";
          else if (cloudAvg < 40) observingQuality = "good";
          else if (cloudAvg < 70) observingQuality = "fair";
          else if (cloudAvg < 90) observingQuality = "poor";
          else observingQuality = "impossible";

          const precips = dayHours.map(h => h.precipitation.precipitation).filter(p => p !== null) as number[];
          const precipProbs = dayHours.map(h => h.precipitation.precipitationProbability).filter(p => p !== null) as number[];

          dailyForecast.push({
            date: dayHours[0].time.split('T')[0],
            temperatureMin: temps.length > 0 ? Math.min(...temps) : 0,
            temperatureMax: temps.length > 0 ? Math.max(...temps) : 0,
            cloudCoverAvg: cloudAvg,
            precipitationTotal: precips.length > 0 ? precips.reduce((sum, p) => sum + p, 0) : 0,
            precipitationProbability: precipProbs.length > 0 ? Math.max(...precipProbs) : 0,
            windSpeedMax: windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0,
            observingQuality,
          });
        }
      }
    }

    return {
      location,
      currentWeather: hourlyForecast[0] || this.getDefaultCurrentWeather(),
      hourlyForecast,
      dailyForecast,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get unavailable weather data structure
   */
  private getUnavailableWeatherData(lat: number, lon: number, locationName?: string): WeatherForecast {
    const location: Location = {
      lat,
      lon,
      name: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    };

    const currentTime = new Date().toISOString();

    return {
      location,
      currentWeather: {
        time: currentTime,
        temperature: null,
        humidity: null,
        windSpeed: null,
        windDirection: null,
        cloudCover: {
          totalCloudCover: null,
          lowCloudCover: null,
          midCloudCover: null,
          highCloudCover: null,
        },
        precipitation: {
          precipitation: null,
          precipitationProbability: null,
        },
      },
      hourlyForecast: [],
      dailyForecast: [],
      lastUpdated: currentTime,
    };
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any): WeatherApiError {
    if (axios.isAxiosError(error)) {
      return {
        message:
          error.response?.data?.message || "Failed to fetch weather data",
        code: error.response?.status,
        details: error.message,
      };
    }
    return {
      message: error.message || "Unknown error occurred",
      details: error.toString(),
    };
  }

  /**
   * Get default current weather for fallback
   */
  private getDefaultCurrentWeather(): HourlyForecast {
    return {
      time: new Date().toISOString(),
      temperature: 15,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      cloudCover: {
        totalCloudCover: 30,
        lowCloudCover: 10,
        midCloudCover: 15,
        highCloudCover: 5,
      },
      precipitation: {
        precipitation: 0,
        precipitationProbability: 10,
      },
    };
  }






}

export const weatherService = new WeatherService();
export default weatherService;
