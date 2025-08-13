import {
  encodeLocationsToUrl,
  decodeLocationsFromUrl,
  generateShareUrl,
} from '../urlUtils';
import { WeatherQueryParams } from '../../hooks/useWeatherData';

// Mock window.location
const mockLocation = {
  origin: 'https://phantastro.pages.dev',
  pathname: '/',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('urlUtils', () => {
  describe('encodeLocationsToUrl', () => {
    it('should encode empty array to empty string', () => {
      expect(encodeLocationsToUrl([])).toBe('');
    });

    it('should encode single location', () => {
      const locations: WeatherQueryParams[] = [
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
      ];
      const result = encodeLocationsToUrl(locations);
      expect(result).toBe('53.5511,9.9937,Hamburg%2C%20Germany');
    });

    it('should encode multiple locations', () => {
      const locations: WeatherQueryParams[] = [
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
        { lat: 40.7128, lon: -74.006, name: 'New York, USA' },
      ];
      const result = encodeLocationsToUrl(locations);
      expect(result).toBe(
        '53.5511,9.9937,Hamburg%2C%20Germany|40.7128,-74.0060,New%20York%2C%20USA'
      );
    });

    it('should handle location without name', () => {
      const locations: WeatherQueryParams[] = [{ lat: 53.5511, lon: 9.9937 }];
      const result = encodeLocationsToUrl(locations);
      expect(result).toBe('53.5511,9.9937,');
    });
  });

  describe('decodeLocationsFromUrl', () => {
    it('should decode empty string to empty array', () => {
      expect(decodeLocationsFromUrl('')).toEqual([]);
      expect(decodeLocationsFromUrl('   ')).toEqual([]);
    });

    it('should decode single location', () => {
      const result = decodeLocationsFromUrl(
        '53.5511,9.9937,Hamburg%2C%20Germany'
      );
      expect(result).toEqual([
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
      ]);
    });

    it('should decode multiple locations', () => {
      const result = decodeLocationsFromUrl(
        '53.5511,9.9937,Hamburg%2C%20Germany|40.7128,-74.0060,New%20York%2C%20USA'
      );
      expect(result).toEqual([
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
        { lat: 40.7128, lon: -74.006, name: 'New York, USA' },
      ]);
    });

    it('should handle location without name', () => {
      const result = decodeLocationsFromUrl('53.5511,9.9937,');
      expect(result).toEqual([{ lat: 53.5511, lon: 9.9937 }]);
    });

    it('should filter out invalid coordinates', () => {
      const result = decodeLocationsFromUrl(
        '53.5511,9.9937,Hamburg|invalid,coords,Test|91.0,0.0,Invalid'
      );
      expect(result).toEqual([{ lat: 53.5511, lon: 9.9937, name: 'Hamburg' }]);
    });

    it('should handle malformed input gracefully', () => {
      expect(decodeLocationsFromUrl('invalid')).toEqual([]);
      expect(decodeLocationsFromUrl('53.5511')).toEqual([]);
    });
  });

  describe('generateShareUrl', () => {
    it('should generate base URL for empty locations', () => {
      const result = generateShareUrl([]);
      expect(result).toBe('https://phantastro.pages.dev/');
    });

    it('should generate URL with locations parameter', () => {
      const locations: WeatherQueryParams[] = [
        { lat: 53.5511, lon: 9.9937, name: 'Hamburg, Germany' },
      ];
      const result = generateShareUrl(locations);
      expect(result).toBe(
        'https://phantastro.pages.dev/?locs=53.5511,9.9937,Hamburg%2C%20Germany'
      );
    });
  });
});
