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
    } else {
      // Validate API key on startup (async, doesn't block)
      this.validateApiKey().catch(() => {
        console.warn("API key validation failed on startup - data will show as 'Not available'");
      });
    }
  }

  /**
   * Validate API key and check service availability
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      console.log("API key not configured, using mock data");
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
    try {
      // Use only basic weather data from meteoblue
      const basicData = await this.fetchBasicWeatherData(lat, lon);

      const location: Location = {
        lat,
        lon,
        name: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        timezone: basicData.metadata?.timezone_abbreviation,
      };

      const forecast = this.transformMeteoblueData(basicData, location);

      return forecast;
    } catch (error) {
      // Return unavailable data structure instead of throwing
      return this.getUnavailableWeatherData(lat, lon, locationName);
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
    if (forecast.precipitation.precipitationProbability > 30) {
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

    console.log("Making Meteoblue API request with params:", params);
    // Use the most basic package available in free tier
    // 'basic-1h' provides hourly weather data without astronomy extensions
    // This avoids "invalid package" errors that occur with astro packages
    const response = await axios.get(`${this.baseUrl}/basic-1h`, {
      params,
    });
    console.log("Meteoblue API response received successfully");
    return response.data;
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
    if (data.data_1h) {
      for (let i = 0; i < Math.min(24, data.data_1h.time.length); i++) {
        // 24 hours of hourly data
        const cloudData: CloudData = {
          totalCloudCover: data.data_1h.cloudcover?.[i] ?? 0,
          lowCloudCover: data.data_1h.cloudcover_low?.[i] ?? 0,
          midCloudCover: data.data_1h.cloudcover_mid?.[i] ?? 0,
          highCloudCover: data.data_1h.cloudcover_high?.[i] ?? 0,
        };

        const precipitationData: PrecipitationData = {
          precipitation: data.data_1h.precipitation?.[i] ?? 0,
          precipitationProbability: data.data_1h.precipitation_probability?.[i] ?? 0,
        };

        hourlyForecast.push({
          time: data.data_1h.time[i],
          temperature: data.data_1h.temperature_2m?.[i] ?? 0,
          humidity: data.data_1h.relativehumidity_2m?.[i] ?? 0,
          windSpeed: data.data_1h.windspeed_10m?.[i] ?? 0,
          windDirection: data.data_1h.winddirection_10m?.[i] ?? 0,
          cloudCover: cloudData,
          precipitation: precipitationData,
          visibility: data.data_1h.visibility?.[i],
        });
      }
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
          const temps = dayHours.map(h => h.temperature);
          const clouds = dayHours.map(h => h.cloudCover.totalCloudCover);
          const windSpeeds = dayHours.map(h => h.windSpeed);

          const cloudAvg = clouds.reduce((sum, c) => sum + c, 0) / clouds.length;
          let observingQuality: DailyForecast["observingQuality"] = "fair";
          if (cloudAvg < 20) observingQuality = "excellent";
          else if (cloudAvg < 40) observingQuality = "good";
          else if (cloudAvg < 70) observingQuality = "fair";
          else if (cloudAvg < 90) observingQuality = "poor";
          else observingQuality = "impossible";

          dailyForecast.push({
            date: dayHours[0].time.split('T')[0],
            temperatureMin: Math.min(...temps),
            temperatureMax: Math.max(...temps),
            cloudCoverAvg: cloudAvg,
            precipitationTotal: dayHours.reduce((sum, h) => sum + h.precipitation.precipitation, 0),
            precipitationProbability: Math.max(...dayHours.map(h => h.precipitation.precipitationProbability)),
            windSpeedMax: Math.max(...windSpeeds),
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
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        windDirection: 0,
        cloudCover: {
          totalCloudCover: 0,
          lowCloudCover: 0,
          midCloudCover: 0,
          highCloudCover: 0,
        },
        precipitation: {
          precipitation: 0,
          precipitationProbability: 0,
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
