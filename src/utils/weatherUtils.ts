import { format, parseISO, isToday, isTomorrow } from "date-fns";

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
    return { description: "Clear skies", color: "#ffffff", emoji: "🌌" };
  if (percentage < 25)
    return { description: "Mostly clear", color: "#ffffff", emoji: "🌙" };
  if (percentage < 50)
    return { description: "Partly cloudy", color: "#ffffff", emoji: "⛅" };
  if (percentage < 75)
    return { description: "Mostly cloudy", color: "#ffffff", emoji: "☁️" };
  if (percentage < 90)
    return { description: "Overcast", color: "#ffffff", emoji: "☁️" };
  return { description: "Heavy overcast", color: "#ffffff", emoji: "☁️" };
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
 * Get observing quality icon name for Iconify
 */
export const getObservingQualityIcon = (quality: string): string => {
  switch (quality) {
    case "excellent":
      return "mdi:star";
    case "good":
      return "mdi:star-outline";
    case "fair":
      return "mdi:weather-partly-cloudy";
    case "poor":
      return "mdi:weather-cloudy";
    case "impossible":
      return "mdi:weather-rainy";
    default:
      return "mdi:help-circle-outline";
  }
};

/**
 * Get observing quality emoji (deprecated - use getObservingQualityIcon instead)
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
 * Get precipitation type icon name for Iconify
 */
export const getPrecipitationIcon = (
  probability: number | null,
  temperature: number | null,
): string => {
  if (probability === null || temperature === null || probability === 0) return "";
  if (temperature < 0) return "mdi:weather-snowy";
  if (probability < 30) return "mdi:weather-partly-rainy";
  if (probability < 70) return "mdi:weather-rainy";
  return "mdi:weather-lightning-rainy";
};

/**
 * Get precipitation type emoji based on probability (deprecated - use getPrecipitationIcon instead)
 */
export const getPrecipitationEmoji = (
  probability: number | null,
  temperature: number | null,
): string => {
  if (probability === null || temperature === null || probability === 0) return "";
  if (temperature < 0) return "❄️";
  if (probability < 30) return "🌦️";
  if (probability < 70) return "🌧️";
  return "⛈️";
};

/**
 * Get rain state based on precipitation probability
 */
export const getRainState = (probability: number | null): {
  hasRain: boolean;
  intensity: number;
  description: string;
} => {
  if (probability === null || probability === 0) {
    return { hasRain: false, intensity: 0, description: "No rain" };
  }
  if (probability < 30) {
    return { hasRain: true, intensity: 0.3, description: "Light chance" };
  }
  if (probability < 50) {
    return { hasRain: true, intensity: 0.5, description: "Moderate chance" };
  }
  if (probability < 70) {
    return { hasRain: true, intensity: 0.7, description: "High chance" };
  }
  return { hasRain: true, intensity: 1.0, description: "Very high chance" };
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
  if (visibility >= 20) return { description: "Excellent", color: "#22c55e" };
  if (visibility >= 15) return { description: "Very Good", color: "#84cc16" };
  if (visibility >= 10) return { description: "Good", color: "#eab308" };
  if (visibility >= 5) return { description: "Fair", color: "#f97316" };
  return { description: "Poor", color: "#ef4444" };
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

/**
 * Format moonlight percentage or show "Not available"
 */
export const formatMoonlight = (moonlight: number | null): string => {
  if (moonlight === null || moonlight === undefined) {
    return "Not available";
  }
  return `${Math.round(moonlight)}%`;
};

/**
 * Get moonlight impact on astronomical observation
 */
export const getMoonlightImpact = (
  moonlightClearSky: number | null,
): { description: string; color: string; advice: string; quality: string } => {
  if (moonlightClearSky === null || moonlightClearSky === undefined) {
    return {
      description: "Not available",
      color: "#6b7280",
      advice: "Moonlight data not available",
      quality: "poor",
    };
  }

  if (moonlightClearSky < 5) {
    return {
      description: "New Moon",
      color: "#22c55e",
      advice: "Excellent for deep sky objects and faint targets",
      quality: "excellent",
    };
  }
  if (moonlightClearSky < 15) {
    return {
      description: "Dark Skies",
      color: "#84cc16",
      advice: "Very good for deep sky observation",
      quality: "good",
    };
  }
  if (moonlightClearSky < 35) {
    return {
      description: "Some Moonlight",
      color: "#eab308",
      advice: "Good for planets and bright targets",
      quality: "fair",
    };
  }
  if (moonlightClearSky < 65) {
    return {
      description: "Moderate Moonlight",
      color: "#f97316",
      advice: "Challenging for deep sky, good for moon/planets",
      quality: "poor",
    };
  }
  return {
    description: "Bright Moonlight",
    color: "#ef4444",
    advice: "Best for lunar and planetary observation only",
    quality: "poor",
  };
};

/**
 * Get night sky brightness description
 */
export const getNightSkyBrightnessInfo = (
  brightness: number | null,
): { description: string; color: string } => {
  if (brightness === null || brightness === undefined) {
    return { description: "Not available", color: "#6b7280" };
  }

  // Brightness in lux - lower is better for astronomy
  if (brightness < 0.001) {
    return { description: "Excellent", color: "#22c55e" };
  }
  if (brightness < 0.01) {
    return { description: "Very Good", color: "#84cc16" };
  }
  if (brightness < 0.1) {
    return { description: "Good", color: "#eab308" };
  }
  if (brightness < 1) {
    return { description: "Fair", color: "#f97316" };
  }
  return { description: "Poor", color: "#ef4444" };
};

/**
 * Get optimal observation types based on moonlight conditions
 */
export const getOptimalObservationTypes = (
  moonlightClearSky: number | null,
  cloudCover: number | null,
): string[] => {
  const recommendations: string[] = [];

  if (moonlightClearSky === null || cloudCover === null) {
    return ["Data not available"];
  }

  if (cloudCover > 70) {
    return ["Poor conditions for all observation types"];
  }

  if (moonlightClearSky < 15 && cloudCover < 30) {
    recommendations.push("Deep sky objects", "Galaxy hunting", "Nebula photography");
  }

  if (moonlightClearSky < 35 && cloudCover < 50) {
    recommendations.push("Star clusters", "Double stars", "Variable stars");
  }

  if (moonlightClearSky > 35 || cloudCover < 70) {
    recommendations.push("Planetary observation", "Lunar features", "Bright targets");
  }

  if (moonlightClearSky > 60) {
    recommendations.push("Moon observation", "Bright planets only");
  }

  return recommendations.length > 0 ? recommendations : ["Limited observation opportunities"];
};

/**
 * Format sun/moon rise/set time with special case handling
 */
export const formatSunMoonTime = (timeString: string | null | undefined): string => {
  if (!timeString || timeString === '---') return '---';
  if (timeString === '00:00') return 'All day';
  if (timeString === '24:00') return 'All day';
  return timeString;
};

/**
 * Get moon phase icon name for Iconify using Weather Icons by Erik Flowers
 * Provides more precise moon phase representation with 28 different phases
 */
export const getMoonPhaseIcon = (
  phaseName: string | null,
  illuminatedFraction?: number | null,
  moonAge?: number | null
): string => {
  if (!phaseName) return 'wi:moon-alt-new';

  // If we have moon age data (most precise), use it first
  if (moonAge !== null && moonAge !== undefined) {
    return getMoonPhaseIconByAge(moonAge);
  }

  // If we have illumination data, use it for more precise icon selection
  if (illuminatedFraction !== null && illuminatedFraction !== undefined) {
    return getMoonPhaseIconByIllumination(illuminatedFraction);
  }

  // Fallback to basic phase name mapping
  switch (phaseName.toLowerCase()) {
    case 'new':
    case 'new moon':
      return 'wi:moon-new';
    case 'waxing crescent':
      return 'wi:moon-waxing-crescent-3';
    case 'first quarter':
      return 'wi:moon-first-quarter';
    case 'waxing gibbous':
      return 'wi:moon-waxing-gibbous-3';
    case 'full':
    case 'full moon':
      return 'wi:moon-full';
    case 'waning gibbous':
      return 'wi:moon-waning-gibbous-3';
    case 'last quarter':
    case 'third quarter':
      return 'wi:moon-third-quarter';
    case 'waning crescent':
      return 'wi:moon-waning-crescent-3';
    default:
      return 'wi:moon-alt-new';
  }
};

/**
 * Get precise moon phase icon based on moon age (0-29.5 days)
 * Uses Weather Icons' 28-phase moon cycle for most accurate representation
 */
export const getMoonPhaseIconByAge = (moonAge: number): string => {
  // Normalize moon age to 0-29.5 day cycle
  const age = Math.max(0, Math.min(29.5, moonAge));

  // Map moon age to Weather Icons (28 phases covering ~29.5 day cycle)
  if (age < 1) return 'wi:moon-new';
  if (age < 2) return 'wi:moon-waxing-crescent-1';
  if (age < 3) return 'wi:moon-waxing-crescent-2';
  if (age < 4) return 'wi:moon-waxing-crescent-3';
  if (age < 5) return 'wi:moon-waxing-crescent-4';
  if (age < 6) return 'wi:moon-waxing-crescent-5';
  if (age < 7) return 'wi:moon-waxing-crescent-6';
  if (age < 8.5) return 'wi:moon-first-quarter';
  if (age < 9.5) return 'wi:moon-waxing-gibbous-1';
  if (age < 10.5) return 'wi:moon-waxing-gibbous-2';
  if (age < 11.5) return 'wi:moon-waxing-gibbous-3';
  if (age < 12.5) return 'wi:moon-waxing-gibbous-4';
  if (age < 13.5) return 'wi:moon-waxing-gibbous-5';
  if (age < 14.5) return 'wi:moon-waxing-gibbous-6';
  if (age < 16) return 'wi:moon-full';
  if (age < 17) return 'wi:moon-waning-gibbous-1';
  if (age < 18) return 'wi:moon-waning-gibbous-2';
  if (age < 19) return 'wi:moon-waning-gibbous-3';
  if (age < 20) return 'wi:moon-waning-gibbous-4';
  if (age < 21) return 'wi:moon-waning-gibbous-5';
  if (age < 22) return 'wi:moon-waning-gibbous-6';
  if (age < 23.5) return 'wi:moon-third-quarter';
  if (age < 24.5) return 'wi:moon-waning-crescent-1';
  if (age < 25.5) return 'wi:moon-waning-crescent-2';
  if (age < 26.5) return 'wi:moon-waning-crescent-3';
  if (age < 27.5) return 'wi:moon-waning-crescent-4';
  if (age < 28.5) return 'wi:moon-waning-crescent-5';
  if (age < 29.5) return 'wi:moon-waning-crescent-6';

  return 'wi:moon-new'; // Back to new moon
};

/**
 * Get precise moon phase icon based on illuminated fraction (0-100%)
 * Uses Weather Icons' 28-phase moon cycle for accurate representation
 */
export const getMoonPhaseIconByIllumination = (illuminatedFraction: number): string => {
  // Normalize to 0-100 range (API typically returns percentage)
  const percentage = Math.max(0, Math.min(100, illuminatedFraction));

  // Map illumination percentage to appropriate moon phase icon
  // New Moon (0-3%)
  if (percentage <= 3) return 'wi:moon-new';

  // Waxing Crescent (4-24%)
  if (percentage <= 8) return 'wi:moon-waxing-crescent-1';
  if (percentage <= 12) return 'wi:moon-waxing-crescent-2';
  if (percentage <= 16) return 'wi:moon-waxing-crescent-3';
  if (percentage <= 20) return 'wi:moon-waxing-crescent-4';
  if (percentage <= 24) return 'wi:moon-waxing-crescent-5';
  if (percentage <= 28) return 'wi:moon-waxing-crescent-6';

  // First Quarter (25-49%)
  if (percentage <= 35) return 'wi:moon-first-quarter';

  // Waxing Gibbous (36-74%)
  if (percentage <= 42) return 'wi:moon-waxing-gibbous-1';
  if (percentage <= 48) return 'wi:moon-waxing-gibbous-2';
  if (percentage <= 54) return 'wi:moon-waxing-gibbous-3';
  if (percentage <= 60) return 'wi:moon-waxing-gibbous-4';
  if (percentage <= 66) return 'wi:moon-waxing-gibbous-5';
  if (percentage <= 74) return 'wi:moon-waxing-gibbous-6';

  // Full Moon (75-97%)
  if (percentage <= 97) return 'wi:moon-full';

  // For waning phases, we'd need additional context about whether moon is waxing or waning
  // Since we don't have that, we'll use the waxing equivalents for high illumination
  return 'wi:moon-full';
};

/**
 * Calculate dark hours between sunset and moonrise or moonset and sunrise
 */
export const calculateDarkHours = (
  sunrise: string | null,
  sunset: string | null,
  moonrise: string | null,
  moonset: string | null,
): { evening: number | null; morning: number | null } => {
  if (!sunrise || !sunset) {
    return { evening: null, morning: null };
  }

  const parseTime = (time: string): number => {
    if (time === '---' || time === '00:00' || time === '24:00') return -1;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  const sunsetHour = parseTime(sunset);
  const sunriseHour = parseTime(sunrise);
  const moonriseHour = moonrise ? parseTime(moonrise) : -1;
  const moonsetHour = moonset ? parseTime(moonset) : -1;

  let eveningDark = null;
  let morningDark = null;

  // Evening dark hours (sunset to moonrise)
  if (moonriseHour > sunsetHour && moonriseHour !== -1) {
    eveningDark = moonriseHour - sunsetHour;
  }

  // Morning dark hours (moonset to sunrise)
  if (moonsetHour < sunriseHour && moonsetHour !== -1) {
    morningDark = sunriseHour - moonsetHour;
  }

  return { evening: eveningDark, morning: morningDark };
};
