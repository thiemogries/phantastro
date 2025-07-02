import React from "react";
import { LocationSearchResult } from "../types/weather";
import {
  WeatherQueryParams,
} from "../hooks/useWeatherData";
import { useLocationsStorage } from "../hooks/useLocationsStorage";
import { useApiKey } from "../contexts/ApiKeyContext";
import LocationSearch from "./LocationSearch";
import WeeklyOverview from "./WeeklyOverview";
import LoadingSpinner from "./LoadingSpinner";
import ApiKeyLogin from "./ApiKeyLogin";
import "./WeatherApp.css";

interface WeatherAppProps {
  className?: string;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ className }) => {
  const { apiKey, clearApiKey } = useApiKey();
  const [locations, setLocations] = useLocationsStorage();

  const handleLocationSelect = (location: LocationSearchResult) => {
    console.log("📍 WeatherApp: Location selected:", location);

    // Check if location already exists
    const locationExists = locations.some(
      loc => Math.abs(loc.lat - location.lat) < 0.001 &&
             Math.abs(loc.lon - location.lon) < 0.001
    );

    if (!locationExists) {
      const newLocation: WeatherQueryParams = {
        lat: location.lat,
        lon: location.lon,
        locationName: location.name,
      };
      setLocations(prev => [...prev, newLocation]);
    }
  };

  const handleLocationRemove = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleRefresh = () => {
    console.log("🔄 WeatherApp: Refreshing weather data for all locations");
    // Refresh will be handled by individual WeeklyOverview components
    window.location.reload();
  };

  const handleChangeApiKey = () => {
    clearApiKey();
  };

  // Show login page if no API key is present
  if (!apiKey) {
    return <ApiKeyLogin />;
  }

  return (
    <div className={`weather-app ${className || ""}`}>
      {/* Header */}
      <header className="weather-app__header">
        <div className="weather-app__title">
          <h1>Phantastro</h1>
          <p>Astronomical Weather Forecast</p>
        </div>
        <div className="weather-app__controls">
          <LocationSearch onLocationSelect={handleLocationSelect} />
          <button
            className="refresh-button"
            onClick={handleRefresh}
            aria-label="Refresh weather data"
          >
            🔄
          </button>
          <button
            className="settings-button"
            onClick={handleChangeApiKey}
            aria-label="Change API key"
            title="Change API key"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Weather Content - Multiple Locations */}
      {locations.length > 0 && (
        <div className="weather-app__content">
          <div className="locations-container">
            {locations.map((location, index) => (
              <WeeklyOverview
                key={`${location.lat}-${location.lon}`}
                location={location}
                onRemove={locations.length > 1 ? () => handleLocationRemove(index) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Welcome Screen - show when no locations */}
      {locations.length === 0 && (
        <div className="weather-app__welcome">
          <div className="welcome-content">
            <h2>Welcome to Phantastro</h2>
            <p>
              Your specialized weather companion for astronomical observations.
              Get detailed forecasts for cloud coverage and atmospheric
              transparency.
            </p>
            <div className="feature-list">
              <div className="feature">
                <div className="feature-icon">☁️</div>
                <div>
                  <h4>Cloud Coverage</h4>
                  <p>Detailed cloud layer analysis</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">💨</div>
                <div>
                  <h4>Wind Conditions</h4>
                  <p>Wind speed and stability forecast</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">💨</div>
                <div>
                  <h4>Wind & Stability</h4>
                  <p>Equipment stability predictions</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">🌡️</div>
                <div>
                  <h4>Temperature & Humidity</h4>
                  <p>Dew point and comfort analysis</p>
                </div>
              </div>
            </div>
            <p className="get-started-text">
              Use the search bar above to add your first location and start observing!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;
