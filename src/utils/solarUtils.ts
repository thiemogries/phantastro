/**
 * Solar calculation utilities for astronomy applications
 * Provides functions to calculate solar elevation angles and related twilight parameters
 */

export interface SolarPosition {
  elevation: number; // Solar elevation angle in degrees (above horizon)
  azimuth: number; // Solar azimuth angle in degrees (from north)
  declination: number; // Solar declination angle in degrees
  hourAngle: number; // Hour angle in degrees
}

export interface TwilightData {
  twilight: "civil" | "nautical" | "astronomical";
  dawn: Date | null;
  dusk: Date | null;
}

/**
 * Calculate the solar declination angle for a given day of the year
 * @param dayOfYear - Day of the year (1-365/366, where January 1 = 1)
 * @returns Solar declination angle in degrees
 */
function calculateSolarDeclination(dayOfYear: number): number {
  // More accurate formula accounting for Earth's axial tilt and orbital position
  const P = Math.asin(
    0.39795 *
      Math.cos(
        0.2163108 +
          2 * Math.atan(0.9671396 * Math.tan(0.0086 * (dayOfYear - 186))),
      ),
  );
  return P * (180 / Math.PI); // Convert from radians to degrees
}

/**
 * Calculate the equation of time correction for more accurate solar calculations
 * @param dayOfYear - Day of the year (1-365/366)
 * @returns Equation of time correction in minutes
 */
function calculateEquationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;

  // Equation of time in minutes
  const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  return E;
}

/**
 * Calculate the time when the sun reaches a specific elevation angle
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date for calculation (time component is ignored)
 * @param targetElevation - Target solar elevation angle in degrees
 * @param isRising - True for sunrise/dawn, false for sunset/dusk
 * @returns Date object with the calculated time, or null if sun doesn't reach that angle
 */
function calculateSolarTime(
  latitude: number,
  longitude: number,
  date: Date,
  targetElevation: number,
  isRising: boolean,
): Date | null {
  // Get day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;

  const declination = calculateSolarDeclination(dayOfYear);
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const targetRad = targetElevation * (Math.PI / 180);

  // Calculate hour angle for target elevation using:
  // cos(H) = (sin(α) - sin(δ) * sin(φ)) / (cos(δ) * cos(φ))
  const cosHourAngle =
    (Math.sin(targetRad) - Math.sin(decRad) * Math.sin(latRad)) /
    (Math.cos(decRad) * Math.cos(latRad));

  // Check if the sun reaches this elevation at this location and date
  if (cosHourAngle < -1 || cosHourAngle > 1) {
    return null; // Sun never reaches this elevation
  }

  const hourAngleRad = Math.acos(cosHourAngle);
  const hourAngle = hourAngleRad * (180 / Math.PI);

  // Convert hour angle to solar time
  const solarHour = isRising ? 12 - hourAngle / 15 : 12 + hourAngle / 15;

  // Apply equation of time correction
  const equationOfTime = calculateEquationOfTime(dayOfYear);

  // Convert solar time to UTC, accounting for longitude and equation of time
  const utcHour = solarHour - longitude / 15 - equationOfTime / 60;

  // Create the result date
  const resultDate = new Date(date);
  resultDate.setUTCHours(0, 0, 0, 0); // Start with midnight UTC

  // Handle hour wrapping and ensure valid time
  let adjustedHour = utcHour;
  let dayOffset = 0;

  while (adjustedHour < 0) {
    adjustedHour += 24;
    dayOffset -= 1;
  }
  while (adjustedHour >= 24) {
    adjustedHour -= 24;
    dayOffset += 1;
  }

  const hours = Math.floor(adjustedHour);
  const minutes = Math.floor((adjustedHour % 1) * 60);
  const seconds = Math.floor((((adjustedHour % 1) * 60) % 1) * 60);

  resultDate.setUTCHours(hours, minutes, seconds, 0);
  if (dayOffset !== 0) {
    resultDate.setUTCDate(resultDate.getUTCDate() + dayOffset);
  }

  return resultDate;
}

/**
 * Calculate twilight times for a specific date and twilight type
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date for calculation (time component is ignored)
 * @param twilightType - Type of twilight to calculate
 * @returns Twilight data with dawn and dusk times
 */
export function calculateTwilightForDate(
  latitude: number,
  longitude: number,
  date: Date,
  twilightType: "civil" | "nautical" | "astronomical",
): TwilightData {
  // Twilight definitions (solar elevation angles):
  const angles = {
    civil: -6,
    nautical: -12,
    astronomical: -18,
  };

  const targetAngle = angles[twilightType];

  const dawn = calculateSolarTime(latitude, longitude, date, targetAngle, true);
  const dusk = calculateSolarTime(
    latitude,
    longitude,
    date,
    targetAngle,
    false,
  );

  return {
    twilight: twilightType,
    dawn,
    dusk,
  };
}

/**
 * Calculate all twilight times between the given dates and location
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param from - Start Date for calculation (time component is ignored)
 * @param to - End Date for calculation (time component is ignored)
 * @returns Twilight times during the time period
 */
export function calculateTwilightTimes(
  latitude: number,
  longitude: number,
  from: Date,
  to: Date,
): TwilightData[] {
  const results: TwilightData[] = [];
  const twilightTypes: ("civil" | "nautical" | "astronomical")[] = [
    "civil",
    "nautical",
    "astronomical",
  ];

  // Iterate through each day in the date range
  const currentDate = new Date(from);
  currentDate.setHours(0, 0, 0, 0); // Start at midnight

  while (currentDate <= to) {
    // Calculate all twilight types for this date
    for (const twilightType of twilightTypes) {
      const twilightData = calculateTwilightForDate(
        latitude,
        longitude,
        currentDate,
        twilightType,
      );
      results.push(twilightData);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}

/**
 * Calculate sunrise and sunset times for a specific date
 * @param latitude - Latitude in degrees (positive north, negative south)
 * @param longitude - Longitude in degrees (positive east, negative west)
 * @param date - Date for calculation (time component is ignored)
 * @returns Object with sunrise and sunset times, or null if no sunrise/sunset
 */
export function calculateSunriseSunset(
  latitude: number,
  longitude: number,
  date: Date,
): { sunrise: Date | null; sunset: Date | null } {
  // Standard sunrise/sunset is when the sun's center is at -0.833° elevation
  // This accounts for atmospheric refraction and the sun's angular diameter
  const sunAngle = -0.833;

  const sunrise = calculateSolarTime(latitude, longitude, date, sunAngle, true);
  const sunset = calculateSolarTime(latitude, longitude, date, sunAngle, false);

  return { sunrise, sunset };
}
