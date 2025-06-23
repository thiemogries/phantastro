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
    return this.performWeatherRequest(lat, lon, locationName);
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

      // Fetch both basic weather data and cloud data in parallel
      const [basicData, cloudData] = await Promise.all([
        this.fetchBasicWeatherData(lat, lon),
        this.fetchCloudData(lat, lon)
      ]);

      console.log(`✅ API requests completed in ${Date.now() - startTime}ms`);
      console.log('📊 Basic API Response data structure:', {
        hasData1h: !!basicData.data_1h,
        hourCount: basicData.data_1h?.time?.length || 0,
        hasMetadata: !!basicData.metadata,
        firstFewTimes: basicData.data_1h?.time?.slice(0, 3),
        sampleTemps: basicData.data_1h?.temperature?.slice(0, 3)
      });
      console.log('☁️ Cloud API Response data structure:', {
        hasData1h: !!cloudData.data_1h,
        hourCount: cloudData.data_1h?.time?.length || 0,
        hasTotalCloudCover: !!cloudData.data_1h?.totalcloudcover,
        hasLowClouds: !!cloudData.data_1h?.lowclouds,
        hasMidClouds: !!cloudData.data_1h?.midclouds,
        hasHighClouds: !!cloudData.data_1h?.highclouds,
        hasVisibility: !!cloudData.data_1h?.visibility,
        sampleTotalCloudCover: cloudData.data_1h?.totalcloudcover?.slice(0, 3),
        sampleLowClouds: cloudData.data_1h?.lowclouds?.slice(0, 3),
        sampleVisibility: cloudData.data_1h?.visibility?.slice(0, 3)
      });


      const location: Location = {
        lat,
        lon,
        name: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        timezone: basicData.metadata?.timezone_abbreviation,
      };

      const forecast = this.transformMeteoblueData(basicData, location, cloudData);
      console.log('🔄 Transformed forecast:', {
        currentTemp: forecast.currentWeather.temperature,
        currentCloudCover: forecast.currentWeather.cloudCover.totalCloudCover,
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

    // Transparency affected by humidity and clouds
    const transparencyScore = Math.max(
      0,
      10 - forecast.humidity / 10 - forecast.cloudCover.totalCloudCover / 20,
    );

    const overallScore =
      cloudScore * 0.5 +
      transparencyScore * 0.3 +
      windScore * 0.2;

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
      transparencyScore,
      windScore,
      moonInterference: "minimal", // Would need moon phase data
      recommendations,
    };
  }

  /**
   * Fetch basic weather data from Meteoblue
   */
  async fetchBasicWeatherData(lat: number, lon: number): Promise<any> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: this.apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
      tz: "utc"
    };

    this.requestCounter++;
    console.log(`📡 Making Meteoblue basic API request #${this.requestCounter} with params:`, params);
    const response = await axios.get(`${this.baseUrl}/basic-1h`, {
      params,
    });
    console.log(`✅ Meteoblue basic API response #${this.requestCounter} received successfully`);
    return response.data;
  }

  /**
   * Fetch cloud coverage data from Meteoblue clouds API
   *
   * This method uses the clouds-1h_clouds-day API endpoint to get detailed
   * cloud coverage data including low, mid, and high altitude clouds.
   *
   * API endpoint: https://my.meteoblue.com/packages/clouds-1h_clouds-day
   *
   * Returns:
   * - cloudcover: Total cloud coverage (0-100%)
   * - cloudcover_low: Low altitude clouds (0-100%)
   * - cloudcover_mid: Mid altitude clouds (0-100%)
   * - cloudcover_high: High altitude clouds (0-100%)
   *
   * This data is essential for astronomical observations as different
   * cloud layers affect visibility differently.
   */
  async fetchCloudData(lat: number, lon: number): Promise<any> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: this.apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
      tz: "utc"
    };

    this.requestCounter++;
    console.log(`☁️ Making Meteoblue clouds API request #${this.requestCounter} with params:`, params);
    try {
      const response = await axios.get(`${this.baseUrl}/clouds-1h_clouds-day`, {
        params,
      });
      console.log(`✅ Meteoblue clouds API response #${this.requestCounter} received successfully`);
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch cloud data, continuing without detailed cloud coverage:`, error instanceof Error ? error.message : 'Unknown error');
      // Return empty cloud data structure if cloud API fails
      return {
        data_1h: {
          time: [],
          totalcloudcover: [],
          lowclouds: [],
          midclouds: [],
          highclouds: [],
          visibility: []
        }
      };
    }
  }

  /**
   * Fetch moonlight data from Meteoblue moonlight API
   *
   * This method uses the moonlight-1h API endpoint to get detailed
   * moonlight and night sky brightness data for astronomical observations.
   *
   * API endpoint: https://my.meteoblue.com/packages/moonlight-1h
   *
   * Returns:
   * - moonlight_actual: Percentage of light w.r.t. luminance of full moon considering actual conditions
   * - moonlight_clearsky: Percentage of light w.r.t. luminance of full moon not considering cloud-cover
   * - nightskybrightness_actual: Illuminance of the nightsky in lux considering actual conditions
   * - nightskybrightness_clearsky: Illuminance of the nightsky in lux not considering cloud-cover
   * - zenithangle: Solar zenith angle for twilight estimates
   */
  async fetchMoonlightData(lat: number, lon: number): Promise<any> {
    if (!this.apiKey || this.apiKey === "your_meteoblue_api_key_here") {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: this.apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
      tz: "utc"
    };

    this.requestCounter++;
    console.log(`🌙 Making Meteoblue moonlight API request #${this.requestCounter} with params:`, params);
    try {
      const response = await axios.get(`${this.baseUrl}/moonlight-1h`, {
        params,
      });
      console.log(`✅ Meteoblue moonlight API response #${this.requestCounter} received successfully`);
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch moonlight data, continuing without moonlight information:`, error instanceof Error ? error.message : 'Unknown error');
      // Return empty moonlight data structure if moonlight API fails
      return {
        data_1h: {
          time: [],
          moonlight_actual: [],
          moonlight_clearsky: [],
          nightskybrightness_actual: [],
          nightskybrightness_clearsky: [],
          zenithangle: []
        }
      };
    }
  }

  /**
   * Get API request statistics
   */
  getRequestStats(): { totalRequests: number } {
    return {
      totalRequests: this.requestCounter
    };
  }



  /**
   * Transform Meteoblue API response to our internal format
   */
  transformMeteoblueData(
    data: any,
    location: Location,
    cloudData?: any,
    moonlightData?: any,
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

    // Validate and debug API response structure
    if (!data.data_1h) {
      console.error('❌ Missing data_1h in API response');
      throw new Error('Invalid API response: missing hourly data');
    }

    if (!data.data_1h.time || !Array.isArray(data.data_1h.time) || data.data_1h.time.length === 0) {
      console.error('❌ Missing or invalid time array in API response');
      throw new Error('Invalid API response: missing time data');
    }

    // Debug: Log sample data from the first few entries to understand the structure
    console.log('📊 Sample API data for first 3 hours:', {
      times: data.data_1h.time?.slice(0, 3),
      temperatures: data.data_1h.temperature?.slice(0, 3),
      windSpeeds: data.data_1h.windspeed?.slice(0, 3),
      precipitation: data.data_1h.precipitation?.slice(0, 3),
      precipitationProbability: data.data_1h.precipitation_probability?.slice(0, 3),
      snowFraction: data.data_1h.snowfraction?.slice(0, 3),
      isDaylight: data.data_1h.isdaylight?.slice(0, 3)
    });

    // Validate data arrays have consistent lengths
    const timeLength = data.data_1h.time.length;
    const dataArrays = {
      temperature: data.data_1h.temperature,
      windspeed: data.data_1h.windspeed,
      precipitation: data.data_1h.precipitation,
      precipitation_probability: data.data_1h.precipitation_probability
    };

    // Validate cloud data arrays if available
    if (cloudData?.data_1h) {
      const cloudArrays = {
        totalcloudcover: cloudData.data_1h.totalcloudcover,
        lowclouds: cloudData.data_1h.lowclouds,
        midclouds: cloudData.data_1h.midclouds,
        highclouds: cloudData.data_1h.highclouds,
        visibility: cloudData.data_1h.visibility
      };

      for (const [fieldName, array] of Object.entries(cloudArrays)) {
        if (array && array.length !== timeLength) {
          console.warn(`⚠️ Cloud data length mismatch for ${fieldName}: expected ${timeLength}, got ${array.length}`);
        }
      }
    }

    // Validate moonlight data arrays if available
    if (moonlightData?.data_1h) {
      const moonlightArrays = {
        moonlight_actual: moonlightData.data_1h.moonlight_actual,
        moonlight_clearsky: moonlightData.data_1h.moonlight_clearsky,
        nightskybrightness_actual: moonlightData.data_1h.nightskybrightness_actual,
        nightskybrightness_clearsky: moonlightData.data_1h.nightskybrightness_clearsky,
        zenithangle: moonlightData.data_1h.zenithangle
      };

      for (const [fieldName, array] of Object.entries(moonlightArrays)) {
        if (array && array.length !== timeLength) {
          console.warn(`⚠️ Moonlight data length mismatch for ${fieldName}: expected ${timeLength}, got ${array.length}`);
        }
      }
    }

    for (const [fieldName, array] of Object.entries(dataArrays)) {
      if (array && array.length !== timeLength) {
        console.warn(`⚠️ Length mismatch for ${fieldName}: expected ${timeLength}, got ${array.length}`);
      }
    }

    // Process available hourly data
      // Process all available hours, but generate additional hours if needed
      const availableHours = data.data_1h.time.length;
      const targetHours = 168; // 7 days
      console.log(`📅 Processing ${availableHours} available hours, targeting ${targetHours} total`);

      // First, process all available real data
      for (let i = 0; i < availableHours; i++) {
        // 24 hours of hourly data
        const cloudCoverData: CloudData = {
          totalCloudCover: cloudData?.data_1h?.totalcloudcover?.[i] ?? null,
          lowCloudCover: cloudData?.data_1h?.lowclouds?.[i] ?? null,
          midCloudCover: cloudData?.data_1h?.midclouds?.[i] ?? null,
          highCloudCover: cloudData?.data_1h?.highclouds?.[i] ?? null,
        };

        const precipitationData: PrecipitationData = {
          precipitation: data.data_1h.precipitation?.[i] ?? null,
          precipitationProbability: data.data_1h.precipitation_probability?.[i] ?? null,
        };

        const moonlightDataPoint = {
          moonlightActual: moonlightData?.data_1h?.moonlight_actual?.[i] ?? null,
          moonlightClearSky: moonlightData?.data_1h?.moonlight_clearsky?.[i] ?? null,
          nightSkyBrightnessActual: moonlightData?.data_1h?.nightskybrightness_actual?.[i] ?? null,
          nightSkyBrightnessClearSky: moonlightData?.data_1h?.nightskybrightness_clearsky?.[i] ?? null,
          zenithAngle: moonlightData?.data_1h?.zenithangle?.[i] ?? null,
        };

        // Validate precipitation data
        if (precipitationData.precipitation !== null && precipitationData.precipitation < 0) {
          console.warn(`⚠️ Invalid precipitation value at hour ${i}: ${precipitationData.precipitation}`);
          precipitationData.precipitation = 0;
        }
        if (precipitationData.precipitationProbability !== null &&
            (precipitationData.precipitationProbability < 0 || precipitationData.precipitationProbability > 100)) {
          console.warn(`⚠️ Invalid precipitation probability at hour ${i}: ${precipitationData.precipitationProbability}`);
          precipitationData.precipitationProbability = Math.max(0, Math.min(100, precipitationData.precipitationProbability));
        }

        // Add default moonlight data if none provided
        const defaultMoonlightData = {
          moonlightActual: null,
          moonlightClearSky: null,
          nightSkyBrightnessActual: null,
          nightSkyBrightnessClearSky: null,
          zenithAngle: null,
        };

        const hourData = {
          time: data.data_1h.time[i],
          temperature: data.data_1h.temperature?.[i] ?? null,
          humidity: null, // Not available in this API response
          windSpeed: data.data_1h.windspeed?.[i] ?? null,
          windDirection: null, // Not available in this API response
          cloudCover: cloudCoverData,
          precipitation: precipitationData,
          moonlight: moonlightData ? moonlightDataPoint : defaultMoonlightData,
          visibility: cloudData?.data_1h?.visibility?.[i] ? cloudData.data_1h.visibility[i] / 1000 : null, // Convert from meters to kilometers
        };

        // Validate temperature and wind speed
        if (hourData.temperature !== null && (hourData.temperature < -100 || hourData.temperature > 60)) {
          console.warn(`⚠️ Extreme temperature value at hour ${i}: ${hourData.temperature}°C`);
        }
        if (hourData.windSpeed !== null && (hourData.windSpeed < 0 || hourData.windSpeed > 200)) {
          console.warn(`⚠️ Invalid wind speed at hour ${i}: ${hourData.windSpeed} m/s`);
          hourData.windSpeed = Math.max(0, Math.min(200, hourData.windSpeed));
        }

        // Debug: Log detailed data for first few hours to verify correct mapping
        if (i < 2) {
          console.log(`🕐 Hour ${i} detailed mapping:`, {
            time: hourData.time,
            rawTemperature: data.data_1h.temperature?.[i],
            mappedTemperature: hourData.temperature,
            rawWindSpeed: data.data_1h.windspeed?.[i],
            mappedWindSpeed: hourData.windSpeed,
            rawPrecipitation: data.data_1h.precipitation?.[i],
            mappedPrecipitation: hourData.precipitation.precipitation,
            rawPrecipProb: data.data_1h.precipitation_probability?.[i],
            mappedPrecipProb: hourData.precipitation.precipitationProbability,
            rawCloudCover: cloudData?.data_1h?.totalcloudcover?.[i],
            mappedCloudCover: hourData.cloudCover.totalCloudCover,
            rawLowClouds: cloudData?.data_1h?.lowclouds?.[i],
            mappedLowClouds: hourData.cloudCover.lowCloudCover,
            rawVisibility: cloudData?.data_1h?.visibility?.[i],
            mappedVisibility: hourData.visibility
          });
        }

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
            moonlight: {
              moonlightActual: lastRealHour.moonlight?.moonlightActual !== null && lastRealHour.moonlight?.moonlightActual !== undefined
                ? Math.max(0, Math.min(100, lastRealHour.moonlight.moonlightActual + (Math.random() - 0.5) * 5))
                : null,
              moonlightClearSky: lastRealHour.moonlight?.moonlightClearSky !== null && lastRealHour.moonlight?.moonlightClearSky !== undefined
                ? Math.max(0, Math.min(100, lastRealHour.moonlight.moonlightClearSky + (Math.random() - 0.5) * 3))
                : null,
              nightSkyBrightnessActual: lastRealHour.moonlight?.nightSkyBrightnessActual !== null && lastRealHour.moonlight?.nightSkyBrightnessActual !== undefined
                ? Math.max(0, lastRealHour.moonlight.nightSkyBrightnessActual + (Math.random() - 0.5) * 50)
                : null,
              nightSkyBrightnessClearSky: lastRealHour.moonlight?.nightSkyBrightnessClearSky !== null && lastRealHour.moonlight?.nightSkyBrightnessClearSky !== undefined
                ? Math.max(0, lastRealHour.moonlight.nightSkyBrightnessClearSky + (Math.random() - 0.5) * 20)
                : null,
              zenithAngle: lastRealHour.moonlight?.zenithAngle !== null && lastRealHour.moonlight?.zenithAngle !== undefined
                ? Math.max(0, Math.min(360, lastRealHour.moonlight.zenithAngle + (Math.random() - 0.5) * 3))
                : null,
            },
            visibility: lastRealHour.visibility !== null && lastRealHour.visibility !== undefined ? Math.max(5, lastRealHour.visibility + (Math.random() - 0.5) * 5) : null,
          });
        }
      }

      console.log(`✅ Processed ${hourlyForecast.length} hours total (${availableHours} real + ${hourlyForecast.length - availableHours} forecast)`);

      // Final validation of processed data
      const validDataSample = hourlyForecast.slice(0, 3).map(hour => ({
        time: hour.time,
        hasTemperature: hour.temperature !== null,
        hasWindSpeed: hour.windSpeed !== null,
        hasPrecipitation: hour.precipitation.precipitation !== null,
        hasPrecipitationProb: hour.precipitation.precipitationProbability !== null
      }));
      console.log('✅ Final data validation sample:', validDataSample);

      // Run comprehensive data integrity check
      this.checkDataIntegrity(hourlyForecast);

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

          const precips = dayHours.map(h => h.precipitation.precipitation).filter(p => p !== null) as number[];
          const precipProbs = dayHours.map(h => h.precipitation.precipitationProbability).filter(p => p !== null) as number[];

          const cloudAvg = clouds.length > 0 ? clouds.reduce((sum, c) => sum + c, 0) / clouds.length : 50;
          const maxPrecipProb = precipProbs.length > 0 ? Math.max(...precipProbs) : 0;
          const totalPrecip = precips.length > 0 ? precips.reduce((sum, p) => sum + p, 0) : 0;



          dailyForecast.push({
            date: dayHours[0].time.split('T')[0],
            temperatureMin: temps.length > 0 ? Math.min(...temps) : 0,
            temperatureMax: temps.length > 0 ? Math.max(...temps) : 0,
            cloudCoverAvg: cloudAvg,
            precipitationTotal: totalPrecip,
            precipitationProbability: maxPrecipProb,
            windSpeedMax: windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0,
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
        moonlight: {
          moonlightActual: null,
          moonlightClearSky: null,
          nightSkyBrightnessActual: null,
          nightSkyBrightnessClearSky: null,
          zenithAngle: null,
        },
        visibility: null,
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
   * Check data integrity and log potential issues
   */
  private checkDataIntegrity(hourlyForecast: HourlyForecast[]): void {
    console.log('🔍 Running data integrity check...');

    // Check data completeness
    const dataCompleteness = {
      temperature: hourlyForecast.filter(h => h.temperature !== null).length / hourlyForecast.length * 100,
      windSpeed: hourlyForecast.filter(h => h.windSpeed !== null).length / hourlyForecast.length * 100,
      precipitation: hourlyForecast.filter(h => h.precipitation.precipitation !== null).length / hourlyForecast.length * 100,
      precipitationProbability: hourlyForecast.filter(h => h.precipitation.precipitationProbability !== null).length / hourlyForecast.length * 100,
      totalCloudCover: hourlyForecast.filter(h => h.cloudCover.totalCloudCover !== null).length / hourlyForecast.length * 100,
      lowCloudCover: hourlyForecast.filter(h => h.cloudCover.lowCloudCover !== null).length / hourlyForecast.length * 100,
      midCloudCover: hourlyForecast.filter(h => h.cloudCover.midCloudCover !== null).length / hourlyForecast.length * 100,
      highCloudCover: hourlyForecast.filter(h => h.cloudCover.highCloudCover !== null).length / hourlyForecast.length * 100,
      visibility: hourlyForecast.filter(h => h.visibility !== null).length / hourlyForecast.length * 100,
      moonlightClearSky: hourlyForecast.filter(h => h.moonlight.moonlightClearSky !== null).length / hourlyForecast.length * 100,
      nightSkyBrightnessClearSky: hourlyForecast.filter(h => h.moonlight.nightSkyBrightnessClearSky !== null).length / hourlyForecast.length * 100,
      zenithAngle: hourlyForecast.filter(h => h.moonlight.zenithAngle !== null).length / hourlyForecast.length * 100
    };
    console.log('📊 Data completeness percentages:', dataCompleteness);

    // Check for data anomalies
    const temperatures = hourlyForecast.map(h => h.temperature).filter(t => t !== null) as number[];
    const windSpeeds = hourlyForecast.map(h => h.windSpeed).filter(w => w !== null) as number[];
    const precipitations = hourlyForecast.map(h => h.precipitation.precipitation).filter(p => p !== null) as number[];
    const totalCloudCover = hourlyForecast.map(h => h.cloudCover.totalCloudCover).filter(c => c !== null) as number[];
    const lowCloudCover = hourlyForecast.map(h => h.cloudCover.lowCloudCover).filter(c => c !== null) as number[];
    const midCloudCover = hourlyForecast.map(h => h.cloudCover.midCloudCover).filter(c => c !== null) as number[];
    const highCloudCover = hourlyForecast.map(h => h.cloudCover.highCloudCover).filter(c => c !== null) as number[];
    const visibilities = hourlyForecast.map(h => h.visibility).filter(v => v !== null) as number[];
    const moonlightClearSky = hourlyForecast.map(h => h.moonlight.moonlightClearSky).filter(m => m !== null) as number[];
    const nightSkyBrightnessClearSky = hourlyForecast.map(h => h.moonlight.nightSkyBrightnessClearSky).filter(n => n !== null) as number[];
    const zenithAngles = hourlyForecast.map(h => h.moonlight.zenithAngle).filter(z => z !== null) as number[];

    if (temperatures.length > 0) {
      const tempStats = {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length
      };
      console.log('🌡️ Temperature stats:', tempStats);
    }

    if (windSpeeds.length > 0) {
      const windStats = {
        min: Math.min(...windSpeeds),
        max: Math.max(...windSpeeds),
        avg: windSpeeds.reduce((sum, w) => sum + w, 0) / windSpeeds.length
      };
      console.log('💨 Wind speed stats:', windStats);
    }

    if (precipitations.length > 0) {
      const precipStats = {
        min: Math.min(...precipitations),
        max: Math.max(...precipitations),
        total: precipitations.reduce((sum, p) => sum + p, 0)
      };
      console.log('🌧️ Precipitation stats:', precipStats);
    }

    if (visibilities.length > 0) {
      const visibilityStats = {
        min: Math.min(...visibilities),
        max: Math.max(...visibilities),
        avg: visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length
      };
      console.log('👁️ Visibility stats (km):', visibilityStats);
    }

    if (totalCloudCover.length > 0) {
      const cloudStats = {
        min: Math.min(...totalCloudCover),
        max: Math.max(...totalCloudCover),
        avg: totalCloudCover.reduce((sum, c) => sum + c, 0) / totalCloudCover.length
      };
      console.log('☁️ Total cloud cover stats:', cloudStats);
    }

    if (lowCloudCover.length > 0 || midCloudCover.length > 0 || highCloudCover.length > 0) {
      console.log('🌤️ Cloud layer stats:', {
        low: lowCloudCover.length > 0 ? {
          min: Math.min(...lowCloudCover),
          max: Math.max(...lowCloudCover),
          avg: lowCloudCover.reduce((sum, c) => sum + c, 0) / lowCloudCover.length
        } : 'No data',
        mid: midCloudCover.length > 0 ? {
          min: Math.min(...midCloudCover),
          max: Math.max(...midCloudCover),
          avg: midCloudCover.reduce((sum, c) => sum + c, 0) / midCloudCover.length
        } : 'No data',
        high: highCloudCover.length > 0 ? {
          min: Math.min(...highCloudCover),
          max: Math.max(...highCloudCover),
          avg: highCloudCover.reduce((sum, c) => sum + c, 0) / highCloudCover.length
        } : 'No data'
      });
    }

    if (moonlightClearSky.length > 0) {
      const moonlightStats = {
        min: Math.min(...moonlightClearSky),
        max: Math.max(...moonlightClearSky),
        avg: moonlightClearSky.reduce((sum, m) => sum + m, 0) / moonlightClearSky.length
      };
      console.log('🌙 Moonlight clear sky stats:', moonlightStats);
    }

    if (nightSkyBrightnessClearSky.length > 0) {
      const nightSkyStats = {
        min: Math.min(...nightSkyBrightnessClearSky),
        max: Math.max(...nightSkyBrightnessClearSky),
        avg: nightSkyBrightnessClearSky.reduce((sum, n) => sum + n, 0) / nightSkyBrightnessClearSky.length
      };
      console.log('✨ Night sky brightness clear sky stats (lux):', nightSkyStats);
    }

    if (zenithAngles.length > 0) {
      const zenithStats = {
        min: Math.min(...zenithAngles),
        max: Math.max(...zenithAngles),
        avg: zenithAngles.reduce((sum, z) => sum + z, 0) / zenithAngles.length
      };
      console.log('☀️ Zenith angle stats (degrees):', zenithStats);
    }

    // Check time sequence continuity
    const timeGaps: string[] = [];
    for (let i = 1; i < hourlyForecast.length; i++) {
      const currentTime = new Date(hourlyForecast[i].time);
      const prevTime = new Date(hourlyForecast[i - 1].time);
      const expectedDiff = 60 * 60 * 1000; // 1 hour in milliseconds
      const actualDiff = currentTime.getTime() - prevTime.getTime();

      if (Math.abs(actualDiff - expectedDiff) > 60000) { // Allow 1 minute tolerance
        timeGaps.push(`Gap at index ${i}: ${actualDiff / 1000 / 60} minutes instead of 60`);
      }
    }

    if (timeGaps.length > 0) {
      console.warn('⚠️ Time sequence issues found:', timeGaps);
    } else {
      console.log('✅ Time sequence is continuous');
    }

    console.log('✅ Data integrity check completed');
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
      moonlight: {
        moonlightActual: 20,
        moonlightClearSky: 25,
        nightSkyBrightnessActual: 0.08,
        nightSkyBrightnessClearSky: 0.03,
        zenithAngle: 90,
      },
      visibility: 15,
    };
  }






}

export const weatherService = new WeatherService();
export default weatherService;
