// Test file to validate API response parsing with sample data
import weatherService from './services/weatherService';
import { HourlyForecast, WeatherForecast } from './types/weather';

// Sample API response data matching the structure provided by the user
const sampleApiResponse = {
  "metadata": {
    "modelrun_updatetime_utc": "2025-06-23T06:19+00:00",
    "name": "",
    "height": 9,
    "timezone_abbrevation": "UTC",
    "latitude": 53.5511,
    "modelrun_utc": "2025-06-23T06:19+00:00",
    "longitude": 9.9937,
    "utc_timeoffset": 0,
    "generation_time_ms": 19.119024
  },
  "units": {
    "precipitation": "mm",
    "windspeed": "ms-1",
    "precipitation_probability": "percent",
    "relativehumidity": "percent",
    "temperature": "C",
    "time": "ISO8601",
    "pressure": "hPa",
    "winddirection": "degree"
  },
  "data_1h": {
    "time": [
      "2025-06-23T00:00+00:00",
      "2025-06-23T01:00+00:00",
      "2025-06-23T02:00+00:00",
      "2025-06-23T03:00+00:00",
      "2025-06-23T04:00+00:00",
      "2025-06-23T05:00+00:00",
      "2025-06-23T06:00+00:00",
      "2025-06-23T07:00+00:00",
      "2025-06-23T08:00+00:00",
      "2025-06-23T09:00+00:00",
      "2025-06-23T10:00+00:00",
      "2025-06-23T11:00+00:00",
      "2025-06-23T12:00+00:00",
      "2025-06-23T13:00+00:00",
      "2025-06-23T14:00+00:00",
      "2025-06-23T15:00+00:00",
      "2025-06-23T16:00+00:00",
      "2025-06-23T17:00+00:00",
      "2025-06-23T18:00+00:00",
      "2025-06-23T19:00+00:00"
    ],
    "snowfraction": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "windspeed": [2.91, 2.97, 3.32, 4.09, 4.72, 5.37, 6.05, 6.64, 7.03, 7.47, 7.84, 8.12, 8.08, 8.26, 8.55, 8.71, 8.57, 8.38, 8.04, 7.61],
    "temperature": [16.56, 16, 16, 16, 16.17, 17.17, 17.91, 18.43, 18.7, 18.68, 18.32, 17.66, 17.1, 16.96, 16.95, 17.12, 17.11, 16.82, 16.31, 15.64],
    "precipitation_probability": [49, 49, 44, 0, 0, 0, 0, 5, 6, 15, 63, 84, 92, 92, 85, 25, 16, 9, 7, 6],
    "convective_precipitation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0],
    "precipitation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1.3, 0, 0, 0, 0],
    "isdaylight": [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  }
};

// Sample cloud data response from clouds-1h_clouds-day API
const sampleCloudData = {
  "metadata": {
    "modelrun_updatetime_utc": "2025-06-23T07:00+00:00",
    "name": "",
    "height": 9,
    "timezone_abbrevation": "UTC",
    "latitude": 53.5511,
    "modelrun_utc": "2025-06-23T07:00+00:00",
    "longitude": 9.9937,
    "utc_timeoffset": 0.0,
    "generation_time_ms": 12.390971
  },
  "units": {
    "time": "ISO8601",
    "totalcloudcover": "percent",
    "lowclouds": "percent",
    "midclouds": "percent",
    "highclouds": "percent",
    "visibility": "m",
    "fog_probability": "percent",
    "sunshinetime": "minutes"
  },
  "data_1h": {
    "time": [
      "2025-06-23T00:00+00:00",
      "2025-06-23T01:00+00:00",
      "2025-06-23T02:00+00:00",
      "2025-06-23T03:00+00:00",
      "2025-06-23T04:00+00:00",
      "2025-06-23T05:00+00:00",
      "2025-06-23T06:00+00:00",
      "2025-06-23T07:00+00:00",
      "2025-06-23T08:00+00:00",
      "2025-06-23T09:00+00:00",
      "2025-06-23T10:00+00:00",
      "2025-06-23T11:00+00:00",
      "2025-06-23T12:00+00:00",
      "2025-06-23T13:00+00:00",
      "2025-06-23T14:00+00:00",
      "2025-06-23T15:00+00:00",
      "2025-06-23T16:00+00:00",
      "2025-06-23T17:00+00:00",
      "2025-06-23T18:00+00:00",
      "2025-06-23T19:00+00:00"
    ],
    "totalcloudcover": [33, 43, 48, 68, 87, 83, 81, 72, 93, 84, 74, 64, 58, 100, 71, 54, 55, 54, 56, 55],
    "lowclouds": [33, 43, 48, 68, 87, 83, 81, 72, 68, 60, 63, 55, 58, 68, 71, 54, 55, 54, 56, 55],
    "midclouds": [33, 43, 48, 61, 43, 59, 75, 72, 93, 84, 74, 64, 51, 100, 24, 14, 21, 28, 25, 24],
    "highclouds": [100, 66, 22, 0, 26, 74, 100, 77, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "visibility": [10460, 10160, 10150, 3240, 10030, 13620, 15420, 15620, 16220, 14820, 16020, 13610, 12220, 13220, 15620, 19210, 22010, 22610, 20410, 19410],
    "fog_probability": [0, 0, 0, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "sunshinetime": [0, 0, 0, 3, 4, 6, 8, 13, 0, 6, 12, 19, 22, 0, 14, 25, 24, 25, 23, 24]
  }
};

// Test location data
const testLocation = {
  lat: 53.5511,
  lon: 9.9937,
  name: "Hamburg, Germany"
};

/**
 * Test function to validate API response parsing
 */
export function testApiResponseParsing(): void {
  console.log('🧪 Starting API response parsing test...');

  try {
    // Call the private transform method using bracket notation to bypass TypeScript private access
    const transformMethod = (weatherService as any).transformMeteoblueData;

    if (!transformMethod) {
      console.error('❌ Transform method not found on weather service');
      return;
    }

    console.log('📋 Input data structure:', {
      hasMetadata: !!sampleApiResponse.metadata,
      hasUnits: !!sampleApiResponse.units,
      hasData1h: !!sampleApiResponse.data_1h,
      timeCount: sampleApiResponse.data_1h?.time?.length,
      temperatureCount: sampleApiResponse.data_1h?.temperature?.length,
      windspeedCount: sampleApiResponse.data_1h?.windspeed?.length,
      precipitationCount: sampleApiResponse.data_1h?.precipitation?.length
    });

    console.log('☁️ Cloud data structure:', {
      hasMetadata: !!sampleCloudData.metadata,
      hasData1h: !!sampleCloudData.data_1h,
      timeCount: sampleCloudData.data_1h?.time?.length,
      totalCloudCoverCount: sampleCloudData.data_1h?.totalcloudcover?.length,
      lowCloudCount: sampleCloudData.data_1h?.lowclouds?.length,
      midCloudCount: sampleCloudData.data_1h?.midclouds?.length,
      highCloudCount: sampleCloudData.data_1h?.highclouds?.length,
      visibilityCount: sampleCloudData.data_1h?.visibility?.length,
      fogProbabilityCount: sampleCloudData.data_1h?.fog_probability?.length
    });

    // Transform the sample data with cloud data
    const result: WeatherForecast = transformMethod.call(weatherService, sampleApiResponse, testLocation, sampleCloudData);

    console.log('✅ Transform completed successfully!');
    console.log('📊 Result structure:', {
      hasLocation: !!result.location,
      hasCurrentWeather: !!result.currentWeather,
      hourlyForecastCount: result.hourlyForecast?.length || 0,
      dailyForecastCount: result.dailyForecast?.length || 0,
      hasLastUpdated: !!result.lastUpdated
    });

    // Validate current weather data
    if (result.currentWeather) {
      console.log('🌡️ Current weather validation:', {
        hasTime: !!result.currentWeather.time,
        hasTemperature: result.currentWeather.temperature !== null,
        hasWindSpeed: result.currentWeather.windSpeed !== null,
        hasPrecipitation: result.currentWeather.precipitation?.precipitation !== null,
        hasPrecipitationProbability: result.currentWeather.precipitation?.precipitationProbability !== null,
        hasCloudCover: result.currentWeather.cloudCover?.totalCloudCover !== null,
        temperature: result.currentWeather.temperature,
        windSpeed: result.currentWeather.windSpeed,
        precipitation: result.currentWeather.precipitation?.precipitation,
        precipitationProbability: result.currentWeather.precipitation?.precipitationProbability,
        totalCloudCover: result.currentWeather.cloudCover?.totalCloudCover,
        lowCloudCover: result.currentWeather.cloudCover?.lowCloudCover,
        midCloudCover: result.currentWeather.cloudCover?.midCloudCover,
        highCloudCover: result.currentWeather.cloudCover?.highCloudCover
      });
    }

    // Validate first few hourly forecasts
    if (result.hourlyForecast && result.hourlyForecast.length > 0) {
      console.log('⏰ First 3 hourly forecasts:', result.hourlyForecast.slice(0, 3).map((hour: HourlyForecast, index: number) => ({
        index,
        time: hour.time,
        temperature: hour.temperature,
        windSpeed: hour.windSpeed,
        precipitation: hour.precipitation?.precipitation,
        precipitationProbability: hour.precipitation?.precipitationProbability,
        totalCloudCover: hour.cloudCover?.totalCloudCover,
        lowCloudCover: hour.cloudCover?.lowCloudCover,
        midCloudCover: hour.cloudCover?.midCloudCover,
        highCloudCover: hour.cloudCover?.highCloudCover
      })));
    }

    // Validate daily forecasts
    if (result.dailyForecast && result.dailyForecast.length > 0) {
      console.log('📅 Daily forecasts:', result.dailyForecast.map((day: any, index: number) => ({
        index,
        date: day.date,
        tempMin: day.temperatureMin,
        tempMax: day.temperatureMax,
        cloudCoverAvg: day.cloudCoverAvg,
        precipitationTotal: day.precipitationTotal,
        precipitationProbability: day.precipitationProbability,
        observingQuality: day.observingQuality
      })));
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}

/**
 * Validate cloud data integration specifically
 */
export function validateCloudDataIntegration(): void {
  console.log('☁️ Validating cloud data integration...');

  const weatherService = require('./services/weatherService').default;
  const transformMethod = (weatherService as any).transformMeteoblueData;

  if (!transformMethod) {
    console.error('❌ Transform method not available');
    return;
  }

  try {
    const result = transformMethod.call(weatherService, sampleApiResponse, testLocation, sampleCloudData);

    // Test cloud data mapping
    const currentWeather = result.currentWeather;
    console.log('☁️ Cloud data validation:', {
      hasTotalCloudCover: currentWeather.cloudCover.totalCloudCover !== null,
      hasLowCloudCover: currentWeather.cloudCover.lowCloudCover !== null,
      hasMidCloudCover: currentWeather.cloudCover.midCloudCover !== null,
      hasHighCloudCover: currentWeather.cloudCover.highCloudCover !== null,
      hasVisibility: currentWeather.visibility !== null,
      totalCloudCover: currentWeather.cloudCover.totalCloudCover,
      lowCloudCover: currentWeather.cloudCover.lowCloudCover,
      midCloudCover: currentWeather.cloudCover.midCloudCover,
      highCloudCover: currentWeather.cloudCover.highCloudCover,
      visibility: currentWeather.visibility
    });

    // Validate first few hours have cloud data
    const hoursWithCloudData = result.hourlyForecast.slice(0, 5).map((hour: any, index: number) => ({
      hour: index,
      totalCloudCover: hour.cloudCover.totalCloudCover,
      lowCloudCover: hour.cloudCover.lowCloudCover,
      midCloudCover: hour.cloudCover.midCloudCover,
      highCloudCover: hour.cloudCover.highCloudCover,
      visibility: hour.visibility
    }));

    console.log('⏰ First 5 hours cloud data:', hoursWithCloudData);

    // Check if observing quality calculation uses cloud data
    const dailyQuality = result.dailyForecast[0];
    console.log('📅 Daily forecast quality (should use cloud data):', {
      cloudCoverAvg: dailyQuality.cloudCoverAvg,
      observingQuality: dailyQuality.observingQuality
    });

    console.log('✅ Cloud data integration validation completed');

  } catch (error) {
    console.error('❌ Cloud data validation failed:', error);
  }
}

/**
 * Test function that can be called from browser console
 */
export function runApiTest(): void {
  testApiResponseParsing();
}

/**
 * Test cloud API integration specifically
 */
export function runCloudTest(): void {
  validateCloudDataIntegration();
}

// For development: automatically run test if this file is imported
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode detected - API response test available');
  console.log('💡 Run testApiResponseParsing() or runApiTest() in console to test API parsing');

  // Make test functions available globally for easy console access
  (window as any).testApiResponseParsing = testApiResponseParsing;
  (window as any).runApiTest = runApiTest;
  (window as any).validateCloudDataIntegration = validateCloudDataIntegration;
  (window as any).runCloudTest = runCloudTest;
}
