/**
 * URL utilities for encoding and decoding locations in URL parameters
 */

import { WeatherQueryParams } from '../hooks/useWeatherData';

/**
 * Encode locations array to URL parameter string
 * Format: lat1,lon1,name1|lat2,lon2,name2
 */
export function encodeLocationsToUrl(locations: WeatherQueryParams[]): string {
  if (locations.length === 0) return '';

  return locations
    .map(location => {
      const lat = location.lat.toFixed(4);
      const lon = location.lon.toFixed(4);
      const name = location.name ? encodeURIComponent(location.name) : '';
      return `${lat},${lon},${name}`;
    })
    .join('|');
}

/**
 * Decode locations from URL parameter string
 * Format: lat1,lon1,name1|lat2,lon2,name2
 */
export function decodeLocationsFromUrl(urlParam: string): WeatherQueryParams[] {
  if (!urlParam || urlParam.trim() === '') return [];

  try {
    return urlParam
      .split('|')
      .map(locationStr => {
        const parts = locationStr.split(',');
        if (parts.length < 2) return null;

        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        const name = parts[2] ? decodeURIComponent(parts[2]) : undefined;

        // Validate coordinates
        if (
          isNaN(lat) ||
          isNaN(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          return null;
        }

        const location: WeatherQueryParams = {
          lat,
          lon,
        };

        if (name) {
          location.name = name;
        }

        return location;
      })
      .filter((location): location is WeatherQueryParams => location !== null);
  } catch (error) {
    console.warn('Failed to decode locations from URL:', error);
    return [];
  }
}

/**
 * Generate a shareable URL with current locations
 */
export function generateShareUrl(locations: WeatherQueryParams[]): string {
  const baseUrl = window.location.origin + window.location.pathname;

  if (locations.length === 0) {
    return baseUrl;
  }

  const encodedLocations = encodeLocationsToUrl(locations);
  return `${baseUrl}?locs=${encodedLocations}`;
}

/**
 * Get locations from current URL parameters
 */
export function getLocationsFromUrl(): WeatherQueryParams[] {
  const urlParams = new URLSearchParams(window.location.search);
  const locsParam = urlParams.get('locs');

  if (!locsParam) return [];

  return decodeLocationsFromUrl(locsParam);
}

/**
 * Remove location parameters from URL without page reload
 */
export function clearUrlParameters(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('locs');

  // Update URL without reload
  window.history.replaceState({}, '', url.toString());
}
