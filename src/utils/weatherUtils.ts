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
