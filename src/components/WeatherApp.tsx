import React, { useEffect } from 'react';
import { LocationSearchResult } from '../types/weather';
import { WeatherQueryParams } from '../hooks/useWeatherData';
import { useLocationsStorage } from '../hooks/useLocationsStorage';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useShareLocations } from '../hooks/useShareLocations';
import LocationSearch from './LocationSearch';
import WeeklyOverview from './WeeklyOverview';
import ApiKeyLogin from './ApiKeyLogin';
import SettingsMenu from './SettingsMenu';
import StarField from './StarField';
import packageJson from '../../package.json';
import './WeatherApp.css';

interface WeatherAppProps {
  className?: string;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ className }) => {
  const { apiKey } = useApiKey();
  const [locations, setLocations] = useLocationsStorage();
  const { getSharedLocations, clearSharedUrl } = useShareLocations();

  const handleLocationSelect = (location: LocationSearchResult) => {
    // Location selected - this is normal operation, no logging needed

    // Check if location already exists
    const locationExists = locations.some(
      loc =>
        Math.abs(loc.lat - location.lat) < 0.001 &&
        Math.abs(loc.lon - location.lon) < 0.001
    );

    if (!locationExists) {
      const newLocation: WeatherQueryParams = {
        lat: location.lat,
        lon: location.lon,
        name: location.name,
      };
      setLocations(prev => [...prev, newLocation]);
    }
  };

  const handleLocationRemove = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  // Load shared locations from URL on mount
  useEffect(() => {
    const sharedLocations = getSharedLocations();

    if (sharedLocations.length > 0) {
      setLocations(prev => {
        // Filter out duplicates using the same logic as handleLocationSelect
        const newLocations = sharedLocations.filter(sharedLocation => {
          return !prev.some(
            existingLocation =>
              Math.abs(existingLocation.lat - sharedLocation.lat) < 0.001 &&
              Math.abs(existingLocation.lon - sharedLocation.lon) < 0.001
          );
        });

        // Clear URL parameters after loading
        if (newLocations.length > 0) {
          clearSharedUrl();
        }

        return [...prev, ...newLocations];
      });
    }
  }, [getSharedLocations, setLocations, clearSharedUrl]);

  // Show login page if no API key is present
  if (!apiKey) {
    return <ApiKeyLogin />;
  }

  return (
    <div className={`weather-app ${className || ''}`}>
      {/* Star Field Background */}
      <StarField animate={false} useTimeBasedRotation={true} />

      <div className="weather-app__content">
        {/* Header */}
        <header className="weather-app__header">
          <div className="weather-app__title">
            <h1>Phantastro</h1>
            <p>Astronomical Weather Forecast</p>
          </div>
          <div className="weather-app__controls">
            {locations.length > 0 && (
              <LocationSearch onLocationSelect={handleLocationSelect} />
            )}
            <SettingsMenu locations={locations} />
          </div>
        </header>

        {/* Weather Content - Multiple Locations */}
        {locations.length > 0 && (
          <div className="locations-container">
            {locations.map((location, index) => (
              <WeeklyOverview
                key={`${location.lat}-${location.lon}`}
                location={location}
                onRemove={() => handleLocationRemove(index)}
              />
            ))}
          </div>
        )}

        {/* Getting Started - show when no locations */}
        {locations.length === 0 && (
          <div className="weather-app__welcome">
            <div className="welcome-content">
              <div className="get-started-block">
                <h3 className="get-started-title">Get Started</h3>
                <p className="get-started-text">
                  Search for your location to discover perfect stargazing
                  conditions
                </p>
                <div className="search-container">
                  <LocationSearch onLocationSelect={handleLocationSelect} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version Footer */}
        <footer
          style={{
            marginTop: '2rem',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            opacity: 0.7,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          Phantastro v{packageJson.version}
        </footer>
      </div>
    </div>
  );
};

export default WeatherApp;
