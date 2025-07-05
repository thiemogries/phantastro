/**
 * Hook for sharing locations via URL parameters
 */

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { WeatherQueryParams } from './useWeatherData';
import {
  generateShareUrl,
  getLocationsFromUrl,
  clearUrlParameters,
} from '../utils/urlUtils';

export interface UseShareLocationsReturn {
  /**
   * Generate and copy share URL to clipboard
   */
  shareLocations: (locations: WeatherQueryParams[]) => Promise<void>;

  /**
   * Get locations from current URL parameters
   */
  getSharedLocations: () => WeatherQueryParams[];

  /**
   * Clear URL parameters after loading shared locations
   */
  clearSharedUrl: () => void;
}

/**
 * Hook for managing location sharing via URL parameters
 */
export function useShareLocations(): UseShareLocationsReturn {
  const shareLocations = useCallback(
    async (locations: WeatherQueryParams[]) => {
      try {
        const shareUrl = generateShareUrl(locations);

        // Try to copy to clipboard
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Share URL copied to clipboard!');
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            document.execCommand('copy');
            toast.success('Share URL copied to clipboard!');
          } catch (err) {
            console.warn('Fallback copy failed:', err);
            toast.error(
              'Failed to copy URL. Please copy manually from the address bar.'
            );

            // Update the current URL so user can copy manually
            window.history.replaceState({}, '', shareUrl);
          } finally {
            document.body.removeChild(textArea);
          }
        }
      } catch (error) {
        console.error('Failed to share locations:', error);
        toast.error('Failed to generate share URL');
      }
    },
    []
  );

  const getSharedLocations = useCallback(() => {
    return getLocationsFromUrl();
  }, []);

  const clearSharedUrl = useCallback(() => {
    clearUrlParameters();
  }, []);

  return {
    shareLocations,
    getSharedLocations,
    clearSharedUrl,
  };
}
