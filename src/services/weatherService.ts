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
        "Meteoblue API key not configured. Using mock data for development. " +
        "Get your free API key from https://www.meteoblue.com/en/weather-api"
      );
    } else {
      // Validate API key on startup (async, doesn't block)
      this.validateApiKey().catch(() => {
        console.warn("API key validation failed on startup - will use mock data");
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
      console.log("Will use mock data instead - this provides full functionality for development and testing");
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

      // Always add mock astronomy data since astro package is not available
      forecast.dailyForecast = this.enhanceWithAstronomyData(forecast.dailyForecast);

      return forecast;
    } catch (error) {
      throw this.handleApiError(error);
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
    if (!this.apiKey) {
      // Return mock data for development
      console.log("No API key found, using mock data");
      return this.getMockWeatherData(lat, lon);
    }

    const params = {
      apikey: this.apiKey,
      lat,
      lon,
      format: "json",
    };

    try {
      console.log("Making Meteoblue API request with params:", params);
      // Use the most basic package available in free tier
      // 'basic-1h' provides hourly weather data without astronomy extensions
      // This avoids "invalid package" errors that occur with astro packages
      const response = await axios.get(`${this.baseUrl}/basic-1h`, {
        params,
      });
      console.log("Meteoblue API response received successfully");
      return response.data;
    } catch (error: any) {
      console.error("Meteoblue API error:", error.response?.data || error.message);
      console.log("Falling back to mock data due to API error");
      return this.getMockWeatherData(lat, lon);
    }
  }

  /**
   * Generate mock astronomy data for enhanced features
   */
  private generateMockAstronomyData(): any {
    const days = 7;
    const moonPhases: number[] = [];
    const sunrises: string[] = [];
    const sunsets: string[] = [];

    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);

      // Mock moon phase (0-1, where 0.5 is full moon)
      moonPhases.push(Math.random());

      // Mock sunrise/sunset times
      const sunrise = new Date(date);
      sunrise.setHours(6, 30 + Math.random() * 60, 0, 0);
      sunrises.push(sunrise.toISOString());

      const sunset = new Date(date);
      sunset.setHours(18, 30 + Math.random() * 60, 0, 0);
      sunsets.push(sunset.toISOString());
    }

    return {
      moon_phase: moonPhases,
      sunrise: sunrises,
      sunset: sunsets,
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
    if (data.data_1h) {
      for (let i = 0; i < Math.min(24, data.data_1h.time.length); i++) {
        // 24 hours of hourly data
        const cloudData: CloudData = {
          totalCloudCover: data.data_1h.cloudcover?.[i] || Math.random() * 100,
          lowCloudCover: (data.data_1h.cloudcover?.[i] || Math.random() * 100) * 0.3,
          midCloudCover: (data.data_1h.cloudcover?.[i] || Math.random() * 100) * 0.4,
          highCloudCover: (data.data_1h.cloudcover?.[i] || Math.random() * 100) * 0.3,
        };

        const precipitationData: PrecipitationData = {
          precipitation: data.data_1h.precipitation?.[i] || 0,
          precipitationProbability: Math.random() < 0.2 ? Math.random() * 50 : 0,
        };

        hourlyForecast.push({
          time: data.data_1h.time[i],
          temperature: data.data_1h.temperature_2m?.[i] || 15 + Math.random() * 10,
          humidity: data.data_1h.relativehumidity_2m?.[i] || 50 + Math.random() * 40,
          windSpeed: data.data_1h.windspeed_10m?.[i] || Math.random() * 15,
          windDirection: data.data_1h.winddirection_10m?.[i] || Math.random() * 360,
          cloudCover: cloudData,
          precipitation: precipitationData,
          visibility: 10 + Math.random() * 20,
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
          // Generate mock data for remaining days
          const date = new Date();
          date.setDate(date.getDate() + day);

          const cloudAvg = Math.random() * 100;
          let observingQuality: DailyForecast["observingQuality"] = "fair";
          if (cloudAvg < 20) observingQuality = "excellent";
          else if (cloudAvg < 40) observingQuality = "good";
          else if (cloudAvg < 70) observingQuality = "fair";
          else if (cloudAvg < 90) observingQuality = "poor";
          else observingQuality = "impossible";

          dailyForecast.push({
            date: date.toISOString().split('T')[0],
            temperatureMin: 10 + Math.random() * 5,
            temperatureMax: 20 + Math.random() * 15,
            cloudCoverAvg: cloudAvg,
            precipitationTotal: Math.random() < 0.3 ? Math.random() * 10 : 0,
            precipitationProbability: Math.random() * 100,
            windSpeedMax: 5 + Math.random() * 20,
            observingQuality,
          });
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
   * Enhance daily forecast with mock astronomy data
   */
  private enhanceWithAstronomyData(
    dailyForecast: DailyForecast[],
  ): DailyForecast[] {
    const astronomyData = this.generateMockAstronomyData();

    return dailyForecast.map((day, index) => ({
      ...day,
      moonPhase: astronomyData.moon_phase[index],
      sunrise: astronomyData.sunrise[index],
      sunset: astronomyData.sunset[index],
    }));
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

  /**
   * Mock weather data for development
   */
  private getMockWeatherData(lat: number, lon: number): any {
    const now = new Date();
    const hourlyTimes: string[] = [];
    const temperatures: number[] = [];
    const humidity: number[] = [];
    const windSpeeds: number[] = [];
    const windDirections: number[] = [];
    const cloudCover: number[] = [];
    const precipitation: number[] = [];

    // Generate 72 hours of mock data
    for (let i = 0; i < 72; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      hourlyTimes.push(time.toISOString());

      // Simulate daily temperature variation
      const hour = time.getHours();
      const baseTemp = 15 + Math.sin(((hour - 6) * Math.PI) / 12) * 8;
      temperatures.push(baseTemp + (Math.random() - 0.5) * 4);

      humidity.push(50 + Math.random() * 40);
      windSpeeds.push(Math.random() * 15);
      windDirections.push(Math.random() * 360);
      cloudCover.push(Math.random() * 100);
      precipitation.push(Math.random() < 0.1 ? Math.random() * 5 : 0);
    }

    return {
      metadata: {
        name: `Mock Location`,
        latitude: lat,
        longitude: lon,
        timezone_abbreviation: "UTC",
      },
      data_1h: {
        time: hourlyTimes,
        temperature_2m: temperatures,
        relativehumidity_2m: humidity,
        windspeed_10m: windSpeeds,
        winddirection_10m: windDirections,
        cloudcover: cloudCover,
        cloudcover_low: cloudCover.map((c) => c * 0.3),
        cloudcover_mid: cloudCover.map((c) => c * 0.4),
        cloudcover_high: cloudCover.map((c) => c * 0.3),
        precipitation: precipitation,
        precipitation_probability: precipitation.map((p) =>
          p > 0 ? 60 + Math.random() * 40 : Math.random() * 30,
        ),
      },
      data_day: this.generateMockDailyData(),
    };
  }

  /**
   * Generate mock daily data
   */
  private generateMockDailyData(): any {
    const days = 7;
    const times: string[] = [];
    const tempMin: number[] = [];
    const tempMax: number[] = [];
    const cloudMean: number[] = [];
    const precipSum: number[] = [];
    const precipProb: number[] = [];
    const windMax: number[] = [];

    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      times.push(date.toISOString().split("T")[0]);

      const baseTemp = 15 + (Math.random() - 0.5) * 10;
      tempMin.push(baseTemp - 5 - Math.random() * 5);
      tempMax.push(baseTemp + 5 + Math.random() * 10);

      cloudMean.push(Math.random() * 100);
      precipSum.push(Math.random() < 0.3 ? Math.random() * 10 : 0);
      precipProb.push(Math.random() * 100);
      windMax.push(5 + Math.random() * 20);
    }

    return {
      time: times,
      temperature_2m_min: tempMin,
      temperature_2m_max: tempMax,
      cloudcover_mean: cloudMean,
      precipitation_sum: precipSum,
      precipitation_probability_max: precipProb,
      windspeed_10m_max: windMax,
    };
  }

  /**
   * Mock astronomy data for development
   */
  private getMockAstronomyData(): any {
    return this.generateMockAstronomyData();
  }
}

export const weatherService = new WeatherService();
export default weatherService;
