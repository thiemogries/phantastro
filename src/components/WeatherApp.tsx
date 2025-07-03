import React, { useState, useEffect } from "react";
import {LocationSearchResult} from "../types/weather";
import {WeatherQueryParams,} from "../hooks/useWeatherData";
import {useLocationsStorage} from "../hooks/useLocationsStorage";
import {useApiKey} from "../contexts/ApiKeyContext";
import LocationSearch from "./LocationSearch";
import WeeklyOverview from "./WeeklyOverview";
import ApiKeyLogin from "./ApiKeyLogin";
import SettingsMenu from "./SettingsMenu";
import StarField from "./StarField";
import ConstellationLines from "./ConstellationLines";
import "./WeatherApp.css";

interface WeatherAppProps {
  className?: string;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ className }) => {
  const { apiKey } = useApiKey();
  const [locations, setLocations] = useLocationsStorage();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [starRotation, setStarRotation] = useState(0);

  // Update window size for star field
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync star rotation for constellation alignment
  useEffect(() => {
    const interval = setInterval(() => {
      setStarRotation(prev => prev + 0.001);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleLocationSelect = (location: LocationSearchResult) => {
    console.log("[WeatherApp] Location selected:", location);

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

  // Show login page if no API key is present
  if (!apiKey) {
    return <ApiKeyLogin />;
  }

  return (
    <div className={`weather-app ${className || ""}`}>
      {/* Star Field Background */}
      <StarField
        width={windowSize.width}
        height={windowSize.height}
        animate={false}
        rotation={starRotation}
      />
      {/*<ConstellationLines*/}
      {/*  width={windowSize.width}*/}
      {/*  height={windowSize.height}*/}
      {/*  rotation={starRotation}*/}
      {/*  opacity={0.3}*/}
      {/*  show={true}*/}
      {/*/>*/}

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
          <SettingsMenu />
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
                onRemove={() => handleLocationRemove(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Getting Started - show when no locations */}
      {locations.length === 0 && (
        <div className="weather-app__welcome">
          <div className="welcome-content">
            <div className="get-started-block">
              <h3 className="get-started-title">Get Started</h3>
              <p className="get-started-text">
                Search for your location to discover perfect stargazing conditions
              </p>
              <div className="search-container">
                <LocationSearch onLocationSelect={handleLocationSelect} />
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default WeatherApp;
