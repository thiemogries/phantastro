/**
 * Astronomical coordinate conversion utilities
 * Converts between celestial coordinates (RA/Dec) and screen coordinates
 */

export interface Star {
  id: number;
  name: string;
  ra: number; // Right ascension in radians
  dec: number; // Declination in radians
  magnitude: number; // Visual magnitude
  color: {
    r: number;
    g: number;
    b: number;
  };
}

export interface ConstellationLine {
  id: string;
  name: string;
  lines: number[][][]; // Array of line segments, each containing coordinate pairs
}

export interface ScreenCoordinate {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Convert right ascension and declination to screen coordinates
 * Uses stereographic projection centered on north celestial pole to avoid stretching
 */
export function celestialToScreen(
  ra: number, // Right ascension in radians
  dec: number, // Declination in radians
  width: number,
  height: number,
  rotation: number = 0, // Rotation angle in radians
  centerDec: number = Math.PI / 4 // Center Dec (45 degrees north)
): ScreenCoordinate {
  // Only show stars above a certain declination (northern hemisphere focus)
  const minDeclination = -Math.PI / 6; // -30 degrees and above
  if (dec < minDeclination) {
    return { x: 0, y: 0, visible: false };
  }

  // Apply rotation to RA (rotation around celestial pole)
  // Reverse rotation direction to fix mirroring
  const rotatedRa = ra - rotation;

  // Stereographic projection from north celestial pole
  // This preserves angles and shapes, preventing stretching
  const poleDist = Math.PI / 2 - dec; // Distance from north pole

  // Avoid division by zero at the pole
  if (poleDist < 0.001) {
    return {
      x: width / 2,
      y: height / 2,
      visible: true
    };
  }

  // Stereographic projection formula
  const r = 2 * Math.tan(poleDist / 2);
  const scale = Math.min(width, height) * 0.25;

  // Fix mirroring by flipping the X coordinate
  const projX = -r * Math.cos(rotatedRa) * scale; // Negative to fix mirroring
  const projY = r * Math.sin(rotatedRa) * scale;

  const screenX = width / 2 + projX;
  const screenY = height / 2 - projY; // Flip Y for screen coordinates

  // Check if the star is visible on screen
  const margin = 100;
  const visible = screenX >= -margin && screenX <= width + margin &&
                  screenY >= -margin && screenY <= height + margin;

  return {
    x: screenX,
    y: screenY,
    visible
  };
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert hours to radians (for right ascension)
 */
export function hoursToRadians(hours: number): number {
  return hours * Math.PI / 12;
}

/**
 * Calculate star size based on magnitude
 * Brighter stars (lower magnitude) appear larger
 */
export function magnitudeToSize(magnitude: number, baseSize: number = 1): number {
  // Magnitude scale is logarithmic, brighter stars have lower magnitude
  // Typical range: -1.5 (very bright) to 6 (faintest visible)
  // Much smaller sizes for realistic appearance
  const size = baseSize * Math.pow(1.5, (3 - magnitude) / 2);
  return Math.max(0.5, Math.min(3, size)); // Clamp between 0.5 and 3 pixels
}

/**
 * Calculate star opacity based on magnitude
 */
export function magnitudeToOpacity(magnitude: number): number {
  // Fade out fainter stars
  if (magnitude > 6) return 0;
  if (magnitude < 1) return 1;
  return Math.max(0.1, 1 - (magnitude - 1) / 5);
}

/**
 * Convert star color from 0-1 RGB to CSS color string
 */
export function starColorToCSS(color: { r: number; g: number; b: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get current sidereal time for star rotation
 * This is a simplified calculation for demonstration
 */
export function getCurrentSiderealTime(): number {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  // Simplified: rotate based on time of day
  return (hours / 24) * 2 * Math.PI;
}

/**
 * Filter stars by magnitude limit
 */
export function filterStarsByMagnitude(stars: Star[], maxMagnitude: number): Star[] {
  return stars.filter(star => star.magnitude <= maxMagnitude);
}

/**
 * Sort stars by brightness (magnitude)
 */
export function sortStarsByBrightness(stars: Star[]): Star[] {
  return [...stars].sort((a, b) => a.magnitude - b.magnitude);
}
