import React, { useState } from "react";
import { LocationSearchResult } from "../types/weather";
import {
  WeatherQueryParams,
} from "../hooks/useWeatherData";
import { useLocationsStorage } from "../hooks/useLocationsStorage";
import LocationSearch from "./LocationSearch";
import WeeklyOverview from "./WeeklyOverview";
import LoadingSpinner from "./LoadingSpinner";
import "./WeatherApp.css";

interface WeatherAppProps {
  className?: string;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ className }) => {
  const [locations, setLocations] = useLocationsStorage();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize with default location only if no locations are stored
  React.useEffect(() => {
    if (locations.length === 0) {
      const defaultLat = parseFloat(
        process.env.REACT_APP_DEFAULT_LAT || "53.5511",
      );
      const defaultLon = parseFloat(
        process.env.REACT_APP_DEFAULT_LON || "9.9937",
      );
      const defaultName =
        process.env.REACT_APP_DEFAULT_LOCATION || "Hamburg, Germany";

      console.log("🏠 WeatherApp: No stored locations found, loading default location:", {
        defaultLat,
        defaultLon,
        defaultName,
      });
      setLocations([{
        lat: defaultLat,
        lon: defaultLon,
        locationName: defaultName,
      }]);
    } else {
      console.log("📍 WeatherApp: Loaded stored locations:", locations);
    }
  }, [locations.length, setLocations]);

  // Mark initial load as complete when we have locations
  React.useEffect(() => {
    if (locations.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [locations.length, isInitialLoad]);

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
        </div>
      </header>

      {/* Loading State - only show when no locations */}
      {locations.length === 0 && (
        <div className="weather-app__loading">
          <LoadingSpinner size="large" />
          <p>Loading stellar conditions...</p>
        </div>
      )}

      {/* Weather Content - Multiple Locations */}
      {locations.length > 0 && (
        <div
          className="weather-app__content"
          data-initial-load={isInitialLoad ? "true" : "false"}
        >
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

      {/* App Info */}
      {locations.length === 0 && !isInitialLoad && (
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
            <button
              className="get-started-button"
              onClick={() => {
                const defaultLat = parseFloat(
                  process.env.REACT_APP_DEFAULT_LAT || "53.5511",
                );
                const defaultLon = parseFloat(
                  process.env.REACT_APP_DEFAULT_LON || "9.9937",
                );
                const defaultName =
                  process.env.REACT_APP_DEFAULT_LOCATION || "Hamburg, Germany";
                setLocations([{
                  lat: defaultLat,
                  lon: defaultLon,
                  locationName: defaultName,
                }]);
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;
