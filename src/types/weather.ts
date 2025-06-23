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
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure?: number | null;
}

// Cloud coverage data
export interface CloudData {
  totalCloudCover: number | null; // 0-100%
  lowCloudCover: number | null;   // 0-100%
  midCloudCover: number | null;   // 0-100%
  highCloudCover: number | null;  // 0-100%
}

// Astronomical seeing conditions
export interface SeeingConditions {
  seeing: number;           // arcseconds (1-5, lower is better)
  transparency: number;     // 0-100% (higher is better)
  scintillation: number;   // 0-100% (lower is better for photography)
}

// Precipitation data
export interface PrecipitationData {
  precipitation: number | null;    // mm
  precipitationProbability: number | null; // 0-100%
  precipitationType?: 'rain' | 'snow' | 'sleet' | 'none';
}

// Combined hourly forecast data
export interface HourlyForecast extends WeatherDataPoint {
  cloudCover: CloudData;
  seeing?: SeeingConditions;
  precipitation: PrecipitationData;
  uvIndex?: number;
  visibility?: number | null; // km
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
    modelrun_updatetime_utc: string;
    name: string;
    height: number;
    timezone_abbrevation: string;
    latitude: number;
    modelrun_utc: string;
    longitude: number;
    utc_timeoffset: number;
    generation_time_ms: number;
  };
  units: {
    precipitation: string;
    windspeed: string;
    precipitation_probability: string;
    relativehumidity: string;
    temperature: string;
    time: string;
    pressure: string;
    winddirection: string;
  };
  data_1h?: {
    time: string[];
    snowfraction: number[];
    windspeed: number[];
    temperature: number[];
    precipitation_probability: number[];
    convective_precipitation: number[];
    rainspot: string[];
    precipitation: number[];
    isdaylight: number[];
    // Cloud data from clouds-1h_clouds-day API
    totalcloudcover?: number[];
    lowclouds?: number[];
    midclouds?: number[];
    highclouds?: number[];
    visibility?: number[];
    fog_probability?: number[];
    sunshinetime?: number[];
  };
  data_day?: {
    time: string[];
    temperature_max: number[];
    temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    windspeed_max: number[];
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
