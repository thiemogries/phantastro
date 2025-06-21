import React, { useState, useEffect } from 'react';
import { WeatherForecast, LocationSearchResult, ObservingConditions } from '../types/weather';
import weatherService from '../services/weatherService';
import LocationSearch from './LocationSearch';
import CurrentWeather from './CurrentWeather';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import ObservingConditionsPanel from './ObservingConditionsPanel';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './WeatherApp.css';

interface WeatherAppProps {
  className?: string;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ className }) => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [observingConditions, setObservingConditions] = useState<ObservingConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);

  // Load default location on mount
  useEffect(() => {
    loadDefaultLocation();
  }, []);

  // Calculate observing conditions when forecast changes
  useEffect(() => {
    if (forecast?.currentWeather) {
      const conditions = weatherService.calculateObservingConditions(forecast.currentWeather);
      setObservingConditions(conditions);
    }
  }, [forecast]);

  const loadDefaultLocation = async () => {
    const defaultLat = parseFloat(process.env.REACT_APP_DEFAULT_LAT || '47.3769');
    const defaultLon = parseFloat(process.env.REACT_APP_DEFAULT_LON || '8.5417');
    const defaultName = process.env.REACT_APP_DEFAULT_LOCATION || 'Zurich, Switzerland';

    await loadWeatherData(defaultLat, defaultLon, defaultName);
  };

  const loadWeatherData = async (lat: number, lon: number, locationName: string) => {
    setLoading(true);
    setError(null);

    try {
      const weatherData = await weatherService.getWeatherForecast(lat, lon, locationName);
      setForecast(weatherData);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather data');
      console.error('Weather data loading failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (location: LocationSearchResult) => {
    setSelectedLocation(location);
    await loadWeatherData(location.lat, location.lon, location.name);
  };

  const handleRefresh = () => {
    if (selectedLocation) {
      loadWeatherData(selectedLocation.lat, selectedLocation.lon, selectedLocation.name);
    } else {
      loadDefaultLocation();
    }
  };

  return (
    <div className={`weather-app ${className || ''}`}>
      {/* Header */}
      <header className="weather-app__header">
        <div className="weather-app__title">
          <h1>⭐ Phantastro</h1>
          <p>Astronomical Weather Forecast</p>
        </div>
        <div className="weather-app__controls">
          <LocationSearch onLocationSelect={handleLocationSelect} />
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh weather data"
          >
            🔄
          </button>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="weather-app__loading">
          <LoadingSpinner />
          <p>Loading stellar conditions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
        />
      )}

      {/* Weather Content */}
      {forecast && !loading && (
        <div className="weather-app__content">
          {/* Location Info */}
          <div className="weather-app__location">
            <h2>📍 {forecast.location.name}</h2>
            <p className="coordinates">
              {forecast.location.lat.toFixed(4)}°, {forecast.location.lon.toFixed(4)}°
            </p>
            <p className="last-updated">
              Last updated: {new Date(forecast.lastUpdated).toLocaleTimeString()}
            </p>
          </div>

          {/* Observing Conditions Overview */}
          {observingConditions && (
            <ObservingConditionsPanel
              conditions={observingConditions}
              currentWeather={forecast.currentWeather}
            />
          )}

          {/* Current Weather */}
          <CurrentWeather
            weather={forecast.currentWeather}
            observingConditions={observingConditions}
          />

          {/* Hourly Forecast */}
          <div className="forecast-section">
            <h3>🕐 Next 24 Hours</h3>
            <HourlyForecast
              hourlyData={forecast.hourlyForecast.slice(0, 24)}
            />
          </div>

          {/* Daily Forecast */}
          <div className="forecast-section">
            <h3>📅 7-Day Outlook</h3>
            <DailyForecast
              dailyData={forecast.dailyForecast}
            />
          </div>

          {/* Additional Info */}
          <div className="weather-app__footer">
            <div className="info-grid">
              <div className="info-card">
                <h4>🌙 Best Observing Tonight</h4>
                <p>
                  Check the hourly forecast for periods with low cloud coverage
                  and minimal wind for optimal viewing conditions.
                </p>
              </div>
              <div className="info-card">
                <h4>🔭 Equipment Tips</h4>
                <p>
                  {observingConditions?.recommendations.length ?
                    observingConditions.recommendations[0] :
                    'Conditions look good for astronomical observations!'
                  }
                </p>
              </div>
              <div className="info-card">
                <h4>📊 Data Source</h4>
                <p>
                  Weather data provided by Meteoblue API.
                  Specialized for astronomical observation conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      {!forecast && !loading && !error && (
        <div className="weather-app__welcome">
          <div className="welcome-content">
            <h2>🌟 Welcome to Phantastro</h2>
            <p>
              Your specialized weather companion for astronomical observations.
              Get detailed forecasts for seeing conditions, cloud coverage,
              and atmospheric transparency.
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
                <div className="feature-icon">🌊</div>
                <div>
                  <h4>Seeing Conditions</h4>
                  <p>Atmospheric turbulence forecast</p>
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
              onClick={loadDefaultLocation}
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
