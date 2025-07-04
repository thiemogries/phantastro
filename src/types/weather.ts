// Location interface for coordinates and place information
export interface Location {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  timezone?: string;
  utcOffset?: number;
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

// Precipitation data
export interface PrecipitationData {
  precipitation: number | null;    // mm
  precipitationProbability: number | null; // 0-100%
  precipitationType?: 'rain' | 'snow' | 'sleet' | 'none';
}

// Moonlight data
export interface MoonlightData {
  moonlightActual: number | null;        // 0-100% light w.r.t. full moon (actual conditions)
  moonlightClearSky: number | null;      // 0-100% light w.r.t. full moon (clear sky)
  nightSkyBrightnessActual: number | null; // lux (actual conditions)
  nightSkyBrightnessClearSky: number | null; // lux (clear sky)
  zenithAngle: number | null;            // degrees (solar zenith angle)
}

// Sun and Moon rise/set data
export interface SunMoonData {
  sunrise: string | null;               // "hh:mm" format
  sunset: string | null;                // "hh:mm" format
  moonrise: string | null;              // "hh:mm" format or "---" if no rise
  moonset: string | null;               // "hh:mm" format or "---" if no set
  moonPhaseAngle: number | null;        // degrees (0-360)
  moonIlluminatedFraction: number | null; // percentage (0-100)
  moonPhaseName: string | null;         // "new", "waxing crescent", etc.
  moonAge: number | null;               // days since new moon
}

// Combined hourly forecast data
export interface HourlyForecast extends WeatherDataPoint {
  cloudCover: CloudData;
  precipitation: PrecipitationData;
  moonlight: MoonlightData;
  uvIndex?: number;
  visibility?: number | null; // km
}

// Daily forecast summary
export interface DailyForecast {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  cloudCoverAvg: number;
  precipitationTotal: number;
  precipitationProbability: number;
  windSpeedMax: number;
  moonPhase?: number; // 0-1 (0 = new moon, 0.5 = full moon)
  sunrise?: string;
  sunset?: string;
  sunMoon?: SunMoonData; // Sun and moon rise/set times and moon phase data
}

// Complete weather forecast response
export interface WeatherForecast {
  location: Location;
  currentWeather: HourlyForecast;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  lastUpdated: string;
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
