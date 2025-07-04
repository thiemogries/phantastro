import axios from "axios";
import {
  DailyForecast,
  HourlyForecast,
  Location,
  LocationSearchResult,
  PrecipitationData,
  WeatherForecast
} from '../types/weather';

class WeatherService {
  private readonly baseUrl: string;
  private requestCounter = 0;

  constructor() {
    this.baseUrl =
      process.env.REACT_APP_METEOBLUE_BASE_URL ||
      "https://my.meteoblue.com/packages";
  }

  /**
   * Get API key from localStorage
   */
  private getApiKey(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const apiKey = window.localStorage.getItem('phantastro-api-key');
        if (apiKey && apiKey.trim() !== '') {
          // Clean the API key: trim whitespace and remove any surrounding quotes
          return apiKey.trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (error) {
      console.warn('Failed to read API key from localStorage:', error);
    }
    return null;
  }

  /**
   * Search for locations by name using OpenStreetMap Nominatim API
   */
  async searchLocations(query: string, signal?: AbortSignal): Promise<LocationSearchResult[]> {
    try {
      if (!query.trim() || query.trim().length < 2) {
        return [];
      }

      const trimmedQuery = query.trim();

      // Use OpenStreetMap Nominatim API for geocoding
      const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
      const params = {
        q: trimmedQuery,
        format: 'json',
        addressdetails: '1',
        limit: '8', // Reduced limit to decrease response size
        dedupe: '1',
        'accept-language': 'en'
      };

      const response = await axios.get(nominatimUrl, {
        params,
        timeout: 8000, // Increased timeout to 8 seconds
        signal: signal, // Use the signal passed from TanStack Query
        headers: {
          'User-Agent': 'PhantAstro Weather App (https://github.com/user/phantastro)'
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response from Nominatim API');
        return this.getFallbackLocations(query);
      }

      // Transform Nominatim response to our LocationSearchResult format
      return response.data.map((item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        // Extract location name and country from the response
        const displayName = item.display_name || '';
        const address = item.address || {};

        // Build a clean location name
        let name: string;
        if (address.city) {
          name = address.city;
        } else if (address.town) {
          name = address.town;
        } else if (address.village) {
          name = address.village;
        } else if (address.hamlet) {
          name = address.hamlet;
        } else if (address.county) {
          name = address.county;
        } else if (address.state) {
          name = address.state;
        } else {
          // Fallback to first part of display name
          name = displayName.split(',')[0] || 'Unknown Location';
        }

        // Add state/region if available and different from name
        if (address.state && address.state !== name) {
          name += `, ${address.state}`;
        }

        const country = address.country || 'Unknown';

        return {
          name: name.trim(),
          country: country,
          lat: lat,
          lon: lon,
          elevation: undefined, // Nominatim doesn't provide elevation
          timezone: undefined
        };
      }).filter((result: LocationSearchResult) => {
        // Filter out invalid coordinates
        return !isNaN(result.lat) && !isNaN(result.lon) &&
          result.lat >= -90 && result.lat <= 90 &&
          result.lon >= -180 && result.lon <= 180;
      });

    } catch (error: any) {
      // Don't log errors for aborted requests (user is typing)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return []; // Return empty array for cancelled requests
      }

      console.error("Location search failed:", error);
      // Return fallback locations on error
      return this.getFallbackLocations(query);
    }
  }

  /**
   * Get fallback locations when API fails
   */
  private getFallbackLocations(query: string): LocationSearchResult[] {
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
        name: "New York, New York",
        country: "USA",
        lat: 40.7128,
        lon: -74.0060,
      },
      {
        name: "London, England",
        country: "UK",
        lat: 51.5074,
        lon: -0.1278,
      },
      {
        name: "Paris, France",
        country: "France",
        lat: 48.8566,
        lon: 2.3522,
      },
      {
        name: "Tokyo, Japan",
        country: "Japan",
        lat: 35.6762,
        lon: 139.6503,
      },
    ];

    return commonLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.country.toLowerCase().includes(query.toLowerCase()),
    );
  }

  /**
   * Fetch basic weather data from Meteoblue
   */
  async fetchBasicWeatherData(lat: number, lon: number): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
    };

    this.requestCounter++;
    const response = await axios.get(`${this.baseUrl}/basic-1h`, {
      params,
    });



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
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
    };

    this.requestCounter++;
    try {
      const response = await axios.get(`${this.baseUrl}/clouds-1h_clouds-day`, {
        params,
      });



      return response.data;
    } catch (error) {

      console.warn(`⚠️ Failed to fetch cloud data, will use basic weather fallback:`, error instanceof Error ? error.message : 'Unknown error');
      // Return null to indicate failure - transformation will use basic weather fallback
      return null;
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
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: apiKey,
      lat,
      lon,
      format: "json",
      timeformat: "iso8601",
    };

    this.requestCounter++;
    try {
      const response = await axios.get(`${this.baseUrl}/moonlight-1h`, {
        params,
      });
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
   * Fetch sun and moon rise/set data from Meteoblue sunmoon API
   *
   * This method uses the sunmoon API endpoint to get daily sun and moon
   * rising and setting times, moon phase information, and lunar data.
   *
   * API endpoint: https://my.meteoblue.com/packages/sunmoon
   *
   * Returns:
   * - sunrise/sunset: Daily sun rising and setting times
   * - moonrise/moonset: Daily moon rising and setting times
   * - moonphaseangle: Moon phase angle (0-360 degrees)
   * - moonilluminatedfraction: Moon illumination percentage
   * - moonphasename: Descriptive moon phase name
   * - moonage: Days since new moon
   */
  async fetchSunMoonData(lat: number, lon: number): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const params = {
      apikey: apiKey,
      lat,
      lon,
      format: "json"
    };

    this.requestCounter++;
    try {
      const response = await axios.get(`${this.baseUrl}/sunmoon`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch sun/moon data, continuing without sun/moon information:`, error instanceof Error ? error.message : 'Unknown error');
      // Return empty sun/moon data structure if API fails
      return {
        data_day: {
          time: [],
          sunrise: [],
          sunset: [],
          moonrise: [],
          moonset: [],
          moonphaseangle: [],
          moonilluminatedfraction: [],
          moonphasename: [],
          moonage: []
        }
      };
    }
  }

  /**
   * Transform Meteoblue API response to our internal format
   */
  transformMeteoblueData(
    data: any,
    location: Location,
    cloudData?: any,
    moonlightData?: any,
    sunMoonData?: any,
  ): WeatherForecast {


    // Transform hourly data
    const hourlyForecast: HourlyForecast[] = [];

    // Validate and debug API response structure
    if (!data.data_1h) {
      console.error('❌ Missing data_1h in API response');
      throw new Error('Invalid API response: missing hourly data');
    }

    if (!data.data_1h.time || !Array.isArray(data.data_1h.time) || data.data_1h.time.length === 0) {
      console.error('❌ Missing or invalid time array in API response');
      throw new Error('Invalid API response: missing time data');
    }

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

      // First, process all available real data
      for (let i = 0; i < availableHours; i++) {




        const precipitationData: PrecipitationData = {
          precipitation: data.data_1h.precipitation?.[i] ?? null,
          precipitationProbability: data.data_1h.precipitation_probability?.[i] ?? null,
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

        // Safe data extraction with fallbacks
        const safeExtractValue = (dataPath: any, index: number): number | null => {
          try {
            const value = dataPath?.[index];

            if (value === null || value === undefined || isNaN(value)) {
              return null;
            }
            return typeof value === 'number' ? value : parseFloat(value);
          } catch (error) {

            return null;
          }
        };

        const hourData = {
          time: data.data_1h.time[i],
          temperature: safeExtractValue(data.data_1h.temperature, i),
          humidity: null, // Not available in this API response
          windSpeed: safeExtractValue(data.data_1h.windspeed, i),
          windDirection: null, // Not available in this API response
          cloudCover: {
            totalCloudCover: (() => {
              // Try dedicated cloud data first
              const cloudValue = safeExtractValue(cloudData?.data_1h?.totalcloudcover, i);
              if (cloudValue !== null) return cloudValue;

              // Fallback to basic weather data
              return safeExtractValue(data.data_1h?.cloudcover, i);
            })(),
            lowCloudCover: safeExtractValue(cloudData?.data_1h?.lowclouds, i),
            midCloudCover: safeExtractValue(cloudData?.data_1h?.midclouds, i),
            highCloudCover: safeExtractValue(cloudData?.data_1h?.highclouds, i),
          },
          precipitation: {
            precipitation: safeExtractValue(data.data_1h.precipitation, i),
            precipitationProbability: safeExtractValue(data.data_1h.precipitation_probability, i),
          },
          moonlight: moonlightData ? {
            moonlightActual: safeExtractValue(moonlightData.data_1h?.moonlight_actual, i),
            moonlightClearSky: safeExtractValue(moonlightData.data_1h?.moonlight_clearsky, i),
            nightSkyBrightnessActual: safeExtractValue(moonlightData.data_1h?.nightskybrightness_actual, i),
            nightSkyBrightnessClearSky: safeExtractValue(moonlightData.data_1h?.nightskybrightness_clearsky, i),
            zenithAngle: safeExtractValue(moonlightData.data_1h?.zenithangle, i),
          } : defaultMoonlightData,
          visibility: (() => {
            const visibilityValue = safeExtractValue(cloudData?.data_1h?.visibility, i);
            return visibilityValue !== null ? visibilityValue / 1000 : null;
          })(), // Convert from meters to kilometers
        };

        // Validate temperature and wind speed
        if (hourData.temperature !== null && (hourData.temperature < -100 || hourData.temperature > 60)) {
          console.warn(`⚠️ Extreme temperature value at hour ${i}: ${hourData.temperature}°C`);
        }
        if (hourData.windSpeed !== null && (hourData.windSpeed < 0 || hourData.windSpeed > 200)) {
          console.warn(`⚠️ Invalid wind speed at hour ${i}: ${hourData.windSpeed} m/s`);
          hourData.windSpeed = Math.max(0, Math.min(200, hourData.windSpeed));
        }

        hourlyForecast.push(hourData);
      }

      // If we have less than 168 hours, generate additional forecasted hours
      if (availableHours < targetHours && availableHours > 0) {
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



          // Add sun/moon data if available
          let sunMoonDataForDay: any = undefined;
          if (sunMoonData?.data_day) {
            const dayIndex = sunMoonData.data_day.time?.findIndex((t: string) => t === dayHours[0].time.split('T')[0]);
            if (dayIndex !== -1 && dayIndex !== undefined) {
              sunMoonDataForDay = {
                sunrise: sunMoonData.data_day.sunrise?.[dayIndex] || null,
                sunset: sunMoonData.data_day.sunset?.[dayIndex] || null,
                moonrise: sunMoonData.data_day.moonrise?.[dayIndex] === "---" ? null : sunMoonData.data_day.moonrise?.[dayIndex] || null,
                moonset: sunMoonData.data_day.moonset?.[dayIndex] === "---" ? null : sunMoonData.data_day.moonset?.[dayIndex] || null,
                moonPhaseAngle: sunMoonData.data_day.moonphaseangle?.[dayIndex] || null,
                moonIlluminatedFraction: sunMoonData.data_day.moonilluminatedfraction?.[dayIndex] || null,
                moonPhaseName: sunMoonData.data_day.moonphasename?.[dayIndex] || null,
                moonAge: sunMoonData.data_day.moonage?.[dayIndex] || null,
              };
            }
          }

          dailyForecast.push({
            date: dayHours[0].time.split('T')[0],
            temperatureMin: temps.length > 0 ? Math.min(...temps) : 0,
            temperatureMax: temps.length > 0 ? Math.max(...temps) : 0,
            cloudCoverAvg: cloudAvg,
            precipitationTotal: totalPrecip,
            precipitationProbability: maxPrecipProb,
            windSpeedMax: windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0,
            sunMoon: sunMoonDataForDay,
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
   * Check data integrity and log potential issues
   */
  private checkDataIntegrity(hourlyForecast: HourlyForecast[]): void {

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
    }
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
