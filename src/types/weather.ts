// Location interface for coordinates and place information
export interface Location {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  timezone?: string;
}

// Basic weather data point
export interface WeatherDataPoint {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure?: number;
}

// Cloud coverage data
export interface CloudData {
  totalCloudCover: number; // 0-100%
  lowCloudCover: number;   // 0-100%
  midCloudCover: number;   // 0-100%
  highCloudCover: number;  // 0-100%
}

// Astronomical seeing conditions
export interface SeeingConditions {
  seeing: number;           // arcseconds (1-5, lower is better)
  transparency: number;     // 0-100% (higher is better)
  scintillation: number;   // 0-100% (lower is better for photography)
}

// Precipitation data
export interface PrecipitationData {
  precipitation: number;    // mm
  precipitationProbability: number; // 0-100%
  precipitationType?: 'rain' | 'snow' | 'sleet' | 'none';
}

// Combined hourly forecast data
export interface HourlyForecast extends WeatherDataPoint {
  cloudCover: CloudData;
  seeing?: SeeingConditions;
  precipitation: PrecipitationData;
  uvIndex?: number;
  visibility?: number; // km
}

// Daily forecast summary
export interface DailyForecast {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  cloudCoverAvg: number;
  seeingAvg?: number;
  precipitationTotal: number;
  precipitationProbability: number;
  windSpeedMax: number;
  moonPhase?: number; // 0-1 (0 = new moon, 0.5 = full moon)
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  observingQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'impossible';
}

// Complete weather forecast response
export interface WeatherForecast {
  location: Location;
  currentWeather: HourlyForecast;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  lastUpdated: string;
}

// Meteoblue API specific response structure
export interface MeteoblueResponse {
  metadata: {
    name: string;
    latitude: number;
    longitude: number;
    height: number;
    timezone_abbreviation: string;
    utc_timeoffset: number;
  };
  units: {
    time: string;
    temperature_2m: string;
    relativehumidity_2m: string;
    windspeed_10m: string;
    winddirection_10m: string;
    cloudcover: string;
    precipitation: string;
  };
  data_1h?: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    cloudcover: number[];
    cloudcover_low: number[];
    cloudcover_mid: number[];
    cloudcover_high: number[];
    precipitation: number[];
    precipitation_probability: number[];
    visibility?: number[];
  };
  data_day?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    cloudcover_mean: number[];
  };
}

// API Error interface
export interface WeatherApiError {
  message: string;
  code?: number;
  details?: string;
}

// Observing conditions assessment
export interface ObservingConditions {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'impossible';
  cloudScore: number;     // 0-10 (10 = clear skies)
  seeingScore: number;    // 0-10 (10 = excellent seeing)
  transparencyScore: number; // 0-10 (10 = excellent transparency)
  windScore: number;      // 0-10 (10 = calm conditions)
  moonInterference: 'none' | 'minimal' | 'moderate' | 'significant' | 'extreme';
  recommendations: string[];
}

// Location search result
export interface LocationSearchResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  elevation?: number;
  timezone?: string;
}
