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
      "2025-06-23T09:00+00:00"
    ],
    "snowfraction": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "windspeed": [2.91, 2.97, 3.32, 4.09, 4.72, 5.37, 6.05, 6.64, 7.03, 7.47],
    "temperature": [16.56, 16, 16, 16, 16.17, 17.17, 17.91, 18.43, 18.7, 18.68],
    "precipitation_probability": [49, 49, 44, 0, 0, 0, 0, 5, 6, 15],
    "convective_precipitation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "rainspot": [
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000"
    ],
    "precipitation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "isdaylight": [0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
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

    // Transform the sample data
    const result: WeatherForecast = transformMethod.call(weatherService, sampleApiResponse, testLocation);

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
        temperature: result.currentWeather.temperature,
        windSpeed: result.currentWeather.windSpeed,
        precipitation: result.currentWeather.precipitation?.precipitation,
        precipitationProbability: result.currentWeather.precipitation?.precipitationProbability
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
        precipitationProbability: hour.precipitation?.precipitationProbability
      })));
    }

    // Validate daily forecasts
    if (result.dailyForecast && result.dailyForecast.length > 0) {
      console.log('📅 Daily forecasts:', result.dailyForecast.map((day: any, index: number) => ({
        index,
        date: day.date,
        tempMin: day.temperatureMin,
        tempMax: day.temperatureMax,
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
 * Test function that can be called from browser console
 */
export function runApiTest(): void {
  testApiResponseParsing();
}

// For development: automatically run test if this file is imported
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode detected - API response test available');
  console.log('💡 Run testApiResponseParsing() or runApiTest() in console to test API parsing');

  // Make test function available globally for easy console access
  (window as any).testApiResponseParsing = testApiResponseParsing;
  (window as any).runApiTest = runApiTest;
}
