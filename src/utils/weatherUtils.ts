import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { HourlyForecast } from "../types/weather";

/**
 * Format temperature with appropriate units or show "Not available"
 */
export const formatTemperature = (
  temp: number | null,
  unit: "C" | "F" = "C",
): string => {
  if (temp === null || temp === undefined) {
    return "Not available";
  }
  const rounded = Math.round(temp);
  return `${rounded}°${unit}`;
};

/**
 * Format wind speed with direction or show "Not available"
 */
export const formatWind = (
  speed: number | null,
  direction: number | null,
  unit: "ms" | "kmh" | "mph" = "ms",
): string => {
  if (speed === null || speed === undefined || direction === null || direction === undefined) {
    return "Not available";
  }

  let convertedSpeed = speed;
  let unitLabel = "m/s";

  switch (unit) {
    case "kmh":
      convertedSpeed = speed * 3.6;
      unitLabel = "km/h";
      break;
    case "mph":
      convertedSpeed = speed * 2.237;
      unitLabel = "mph";
      break;
  }

  const windDirection = getWindDirection(direction);
  return `${Math.round(convertedSpeed)} ${unitLabel} ${windDirection}`;
};

/**
 * Convert wind direction degrees to compass direction
 */
export const getWindDirection = (degrees: number): string => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

/**
 * Format cloud coverage percentage
 */
export const formatCloudCover = (percentage: number): string => {
  if (percentage < 10) return "Clear";
  if (percentage < 25) return "Few clouds";
  if (percentage < 50) return "Partly cloudy";
  if (percentage < 75) return "Mostly cloudy";
  if (percentage < 90) return "Overcast";
  return "Complete overcast";
};

/**
 * Get cloud coverage description and color or show unavailable info
 */
export const getCloudCoverageInfo = (
  percentage: number | null,
): { description: string; color: string; emoji: string } => {
  if (percentage === null || percentage === undefined) {
    return { description: "Not available", color: "#6b7280", emoji: "❓" };
  }
  if (percentage < 10)
    return { description: "Clear skies", color: "#4f46e5", emoji: "🌌" };
  if (percentage < 25)
    return { description: "Mostly clear", color: "#7c3aed", emoji: "🌙" };
  if (percentage < 50)
    return { description: "Partly cloudy", color: "#a855f7", emoji: "⛅" };
  if (percentage < 75)
    return { description: "Mostly cloudy", color: "#94a3b8", emoji: "☁️" };
  if (percentage < 90)
    return { description: "Overcast", color: "#64748b", emoji: "☁️" };
  return { description: "Heavy overcast", color: "#475569", emoji: "☁️" };
};



/**
 * Get observing quality color
 */
export const getObservingQualityColor = (quality: string): string => {
  switch (quality) {
    case "excellent":
      return "#22c55e";
    case "good":
      return "#84cc16";
    case "fair":
      return "#eab308";
    case "poor":
      return "#f97316";
    case "impossible":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

/**
 * Get observing quality emoji
 */
export const getObservingQualityEmoji = (quality: string): string => {
  switch (quality) {
    case "excellent":
      return "🌟";
    case "good":
      return "⭐";
    case "fair":
      return "🌤️";
    case "poor":
      return "☁️";
    case "impossible":
      return "🌧️";
    default:
      return "❓";
  }
};

/**
 * Format time for display
 */
export const formatTime = (
  dateString: string,
  formatStr: string = "HH:mm",
): string => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch (error) {
    return "Invalid time";
  }
};

/**
 * Format date for display with relative information
 */
export const formatDateRelative = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Calculate moon phase description
 */
export const getMoonPhaseInfo = (
  phase: number,
): { name: string; emoji: string; illumination: number } => {
  const illumination = Math.round(Math.abs(Math.cos(phase * Math.PI)) * 100);

  if (phase < 0.125) return { name: "New Moon", emoji: "🌑", illumination: 0 };
  if (phase < 0.25)
    return { name: "Waxing Crescent", emoji: "🌒", illumination };
  if (phase < 0.375)
    return { name: "First Quarter", emoji: "🌓", illumination: 50 };
  if (phase < 0.5) return { name: "Waxing Gibbous", emoji: "🌔", illumination };
  if (phase < 0.625)
    return { name: "Full Moon", emoji: "🌕", illumination: 100 };
  if (phase < 0.75)
    return { name: "Waning Gibbous", emoji: "🌖", illumination };
  if (phase < 0.875)
    return { name: "Last Quarter", emoji: "🌗", illumination: 50 };
  return { name: "Waning Crescent", emoji: "🌘", illumination };
};

/**
 * Get precipitation type emoji
 */
export const getPrecipitationEmoji = (
  amount: number | null,
  temperature: number | null,
): string => {
  if (amount === null || temperature === null || amount === 0) return "";
  if (temperature < 0) return "❄️";
  if (amount < 1) return "🌦️";
  if (amount < 5) return "🌧️";
  return "⛈️";
};

/**
 * Get visibility description or show "Not available"
 */
export const getVisibilityInfo = (
  visibility: number | undefined,
): { description: string; color: string } => {
  if (!visibility || visibility === 0) {
    return { description: "Not available", color: "#6b7280" };
  }
  if (visibility > 20) return { description: "Excellent", color: "#22c55e" };
  if (visibility > 10) return { description: "Good", color: "#84cc16" };
  if (visibility > 5) return { description: "Moderate", color: "#eab308" };
  if (visibility > 2) return { description: "Poor", color: "#f97316" };
  return { description: "Very poor", color: "#ef4444" };
};

/**
 * Calculate dew point
 */
export const calculateDewPoint = (
  temperature: number | null,
  humidity: number | null,
): number | null => {
  if (temperature === null || humidity === null) {
    return null;
  }
  const a = 17.27;
  const b = 237.7;
  const alpha =
    (a * temperature) / (b + temperature) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
};

/**
 * Determine if conditions are good for specific types of observation
 */
export const getObservationRecommendations = (
  forecast: HourlyForecast,
): {
  planetary: boolean | null;
  deepSky: boolean | null;
  photography: boolean | null;
  lunar: boolean | null;
  solar: boolean | null;
} => {
  const cloudCover = forecast.cloudCover.totalCloudCover;
  const windSpeed = forecast.windSpeed;

  // Return null (not available) if essential data is missing
  if (cloudCover === null || windSpeed === null) {
    return {
      planetary: null,
      deepSky: null,
      photography: null,
      lunar: null,
      solar: null,
    };
  }

  return {
    planetary: cloudCover < 30 && windSpeed < 10,
    deepSky: cloudCover < 20,
    photography: cloudCover < 15 && windSpeed < 8,
    lunar: cloudCover < 40 && windSpeed < 15,
    solar: cloudCover < 50, // Solar observation can work with some clouds
  };
};

/**
 * Get best observing hours from hourly forecast
 */
export const getBestObservingHours = (
  hourlyForecast: HourlyForecast[],
  count: number = 3,
): HourlyForecast[] => {
  return hourlyForecast
    .map((hour) => ({
      ...hour,
      score: calculateObservingScore(hour),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
};

/**
 * Calculate a comprehensive observing score
 */
export const calculateObservingScore = (forecast: HourlyForecast): number => {
  // Return 0 if essential data is missing
  if (forecast.cloudCover.totalCloudCover === null ||
      forecast.windSpeed === null ||
      forecast.humidity === null ||
      forecast.precipitation.precipitationProbability === null) {
    return 0;
  }

  const cloudScore = Math.max(0, 100 - forecast.cloudCover.totalCloudCover);
  const windScore = Math.max(0, 100 - forecast.windSpeed * 5);
  const humidityScore = Math.max(0, 100 - forecast.humidity);
  const precipScore =
    forecast.precipitation.precipitationProbability === 0 ? 100 : 0;

  // Weight the factors for astronomical observation
  return (
    cloudScore * 0.4 +
    windScore * 0.25 +
    humidityScore * 0.2 +
    precipScore * 0.15
  );
};

/**
 * Get trend indicator for a series of values
 */
export const getTrend = (
  values: number[],
): "improving" | "stable" | "worsening" => {
  if (values.length < 2) return "stable";

  const recent = values.slice(-3);
  const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const older = values.slice(0, -3);
  const olderAverage =
    older.length > 0
      ? older.reduce((sum, val) => sum + val, 0) / older.length
      : average;

  const difference = average - olderAverage;
  const threshold = olderAverage * 0.1; // 10% change threshold

  if (difference > threshold) return "improving";
  if (difference < -threshold) return "worsening";
  return "stable";
};

/**
 * Convert celsius to fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

/**
 * Convert meters per second to other wind speed units
 */
export const convertWindSpeed = (
  ms: number,
  to: "kmh" | "mph" | "kn",
): number => {
  switch (to) {
    case "kmh":
      return ms * 3.6;
    case "mph":
      return ms * 2.237;
    case "kn":
      return ms * 1.944;
    default:
      return ms;
  }
};

/**
 * Format humidity percentage or show "Not available"
 */
export const formatHumidity = (humidity: number | null): string => {
  if (humidity === null || humidity === undefined) {
    return "Not available";
  }
  return `${Math.round(humidity)}%`;
};

/**
 * Get UV index description
 */
export const getUVIndexInfo = (
  uvIndex: number | null | undefined,
): { description: string; color: string; advice: string } => {
  if (uvIndex === null || uvIndex === undefined) {
    return {
      description: "Not available",
      color: "#6b7280",
      advice: "UV data not available",
    };
  }
  if (uvIndex < 3)
    return {
      description: "Low",
      color: "#22c55e",
      advice: "No protection needed for normal activity",
    };
  if (uvIndex < 6)
    return {
      description: "Moderate",
      color: "#eab308",
      advice: "Some protection recommended",
    };
  if (uvIndex < 8)
    return {
      description: "High",
      color: "#f97316",
      advice: "Protection essential",
    };
  if (uvIndex < 11)
    return {
      description: "Very High",
      color: "#ef4444",
      advice: "Extra protection required",
    };
  return {
    description: "Extreme",
    color: "#991b1b",
    advice: "Avoid outdoor activities",
  };
};
