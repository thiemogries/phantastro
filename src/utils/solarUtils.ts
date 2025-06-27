/**
 * Solar calculation utilities for astronomy applications
 * Provides functions to calculate solar elevation angles and related twilight parameters
 */

export interface SolarPosition {
  elevation: number;    // Solar elevation angle in degrees (above horizon)
  azimuth: number;      // Solar azimuth angle in degrees (from north)
  declination: number;  // Solar declination angle in degrees
  hourAngle: number;    // Hour angle in degrees
}

export interface TwilightData {
  civilTwilight: {
    dawn: Date | null;
    dusk: Date | null;
  };
  nauticalTwilight: {
    dawn: Date | null;
    dusk: Date | null;
  };
  astronomicalTwilight: {
    dawn: Date | null;
    dusk: Date | null;
  };
}

/**
 * Calculate the solar declination angle for a given day of the year
 * @param dayOfYear - Day of the year (1-365/366, where January 1 = 1)
 * @returns Solar declination angle in degrees
 */
export function calculateSolarDeclination(dayOfYear: number): number {
  // More accurate formula accounting for Earth's axial tilt and orbital position
  const P = Math.asin(0.39795 * Math.cos(0.2163108 + 2 * Math.atan(0.9671396 * Math.tan(0.00860 * (dayOfYear - 186)))));
  return P * (180 / Math.PI); // Convert from radians to degrees
}

/**
 * Calculate the hour angle based on time and longitude
 * @param date - Date and time for calculation
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @returns Hour angle in degrees (0° at solar noon, negative before noon, positive after)
 */
export function calculateHourAngle(date: Date, longitude: number): number {
  // Calculate local solar time
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Convert to local solar time accounting for longitude
  const localSolarTime = utcHours + longitude / 15; // 15 degrees per hour

  // Hour angle: 0° at solar noon (12:00), 15° per hour from noon
  const hourAngle = 15 * (localSolarTime - 12);

  return hourAngle;
}

/**
 * Calculate the solar elevation angle
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date and time for calculation
 * @returns Solar elevation angle in degrees (positive above horizon)
 */
export function calculateSolarElevation(latitude: number, longitude: number, date: Date): number {
  // Get day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  // Calculate solar declination
  const declination = calculateSolarDeclination(dayOfYear);

  // Calculate hour angle
  const hourAngle = calculateHourAngle(date, longitude);

  // Convert to radians for calculation
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const hourRad = hourAngle * (Math.PI / 180);

  // Calculate solar elevation angle using the formula:
  // α = arcsin(sin(δ) * sin(φ) + cos(δ) * cos(φ) * cos(γ))
  const sinElevation = Math.sin(decRad) * Math.sin(latRad) +
                      Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourRad);

  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation))); // Clamp to valid range
  const elevation = elevationRad * (180 / Math.PI); // Convert to degrees

  return elevation;
}

/**
 * Calculate the solar azimuth angle
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date and time for calculation
 * @returns Solar azimuth angle in degrees (0° = north, 90° = east, 180° = south, 270° = west)
 */
export function calculateSolarAzimuth(latitude: number, longitude: number, date: Date): number {
  // Get day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  // Calculate solar declination and hour angle
  const declination = calculateSolarDeclination(dayOfYear);
  const hourAngle = calculateHourAngle(date, longitude);
  const elevation = calculateSolarElevation(latitude, longitude, date);

  // Convert to radians
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const elevRad = elevation * (Math.PI / 180);

  // Calculate azimuth
  const cosAzimuth = (Math.sin(decRad) - Math.sin(elevRad) * Math.sin(latRad)) /
                     (Math.cos(elevRad) * Math.cos(latRad));

  let azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));

  // Adjust for afternoon (hour angle > 0)
  if (hourAngle > 0) {
    azimuthRad = 2 * Math.PI - azimuthRad;
  }

  return azimuthRad * (180 / Math.PI);
}

/**
 * Calculate complete solar position data
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date and time for calculation
 * @returns Complete solar position information
 */
export function calculateSolarPosition(latitude: number, longitude: number, date: Date): SolarPosition {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const declination = calculateSolarDeclination(dayOfYear);
  const hourAngle = calculateHourAngle(date, longitude);
  const elevation = calculateSolarElevation(latitude, longitude, date);
  const azimuth = calculateSolarAzimuth(latitude, longitude, date);

  return {
    elevation,
    azimuth,
    declination,
    hourAngle
  };
}

/**
 * Calculate twilight times for a given date and location
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date for calculation (time component is ignored)
 * @returns Twilight times for the given date
 */
export function calculateTwilightTimes(latitude: number, longitude: number, date: Date): TwilightData {
  // Twilight definitions (solar elevation angles):
  // Civil twilight: -6°
  // Nautical twilight: -12°
  // Astronomical twilight: -18°

  const civilAngle = -6;
  const nauticalAngle = -12;
  const astronomicalAngle = -18;

  const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return {
    civilTwilight: {
      dawn: findTwilightTime(latitude, longitude, baseDate, civilAngle, true),
      dusk: findTwilightTime(latitude, longitude, baseDate, civilAngle, false)
    },
    nauticalTwilight: {
      dawn: findTwilightTime(latitude, longitude, baseDate, nauticalAngle, true),
      dusk: findTwilightTime(latitude, longitude, baseDate, nauticalAngle, false)
    },
    astronomicalTwilight: {
      dawn: findTwilightTime(latitude, longitude, baseDate, astronomicalAngle, true),
      dusk: findTwilightTime(latitude, longitude, baseDate, astronomicalAngle, false)
    }
  };
}

/**
 * Find the time when the sun reaches a specific elevation angle
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees
 * @param date - Base date for calculation
 * @param targetElevation - Target solar elevation angle in degrees
 * @param isMorning - True for morning (dawn), false for evening (dusk)
 * @returns Date when sun reaches target elevation, or null if it doesn't occur
 */
function findTwilightTime(
  latitude: number,
  longitude: number,
  date: Date,
  targetElevation: number,
  isMorning: boolean
): Date | null {
  // Search range: 2 hours before/after estimated sunrise/sunset
  const searchStart = isMorning ? 4 : 16;  // 4 AM or 4 PM
  const searchEnd = isMorning ? 10 : 22;   // 10 AM or 10 PM

  let bestTime: Date | null = null;
  let smallestDiff = Infinity;

  // Search in 1-minute increments
  for (let hour = searchStart; hour <= searchEnd; hour++) {
    for (let minute = 0; minute < 60; minute++) {
      const testTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      const elevation = calculateSolarElevation(latitude, longitude, testTime);
      const diff = Math.abs(elevation - targetElevation);

      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestTime = new Date(testTime);
      }

      // If we found an exact match (within 0.1 degrees), we can stop
      if (diff < 0.1) {
        break;
      }
    }
  }

  // Return null if we couldn't find a reasonable match (within 2 degrees)
  return smallestDiff < 2 ? bestTime : null;
}

/**
 * Check if it's currently day, night, or twilight
 * @param elevation - Current solar elevation angle in degrees
 * @returns String indicating current period
 */
export function getSolarPeriod(elevation: number): 'day' | 'civil-twilight' | 'nautical-twilight' | 'astronomical-twilight' | 'night' {
  if (elevation > 0) {
    return 'day';
  } else if (elevation > -6) {
    return 'civil-twilight';
  } else if (elevation > -12) {
    return 'nautical-twilight';
  } else if (elevation > -18) {
    return 'astronomical-twilight';
  } else {
    return 'night';
  }
}

/**
 * Get the next significant solar event (sunrise, sunset, or twilight transition)
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees
 * @param currentTime - Current date and time
 * @returns Information about the next solar event
 */
export function getNextSolarEvent(
  latitude: number,
  longitude: number,
  currentTime: Date
): { event: string; time: Date; elevation: number } | null {
  const twilightData = calculateTwilightTimes(latitude, longitude, currentTime);

  const events = [
    { event: 'Astronomical Dawn', time: twilightData.astronomicalTwilight.dawn, elevation: -18 },
    { event: 'Nautical Dawn', time: twilightData.nauticalTwilight.dawn, elevation: -12 },
    { event: 'Civil Dawn', time: twilightData.civilTwilight.dawn, elevation: -6 },
    { event: 'Sunrise', time: findTwilightTime(latitude, longitude, currentTime, 0, true), elevation: 0 },
    { event: 'Sunset', time: findTwilightTime(latitude, longitude, currentTime, 0, false), elevation: 0 },
    { event: 'Civil Dusk', time: twilightData.civilTwilight.dusk, elevation: -6 },
    { event: 'Nautical Dusk', time: twilightData.nauticalTwilight.dusk, elevation: -12 },
    { event: 'Astronomical Dusk', time: twilightData.astronomicalTwilight.dusk, elevation: -18 }
  ].filter(e => e.time && e.time > currentTime)
   .sort((a, b) => a.time!.getTime() - b.time!.getTime());

  return events.length > 0 ? events[0] as { event: string; time: Date; elevation: number } : null;
}
