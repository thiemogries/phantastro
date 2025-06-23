import React, { useState, useEffect } from 'react';
import { WeatherForecast, LocationSearchResult, ObservingConditions } from '../types/weather';
import weatherService from '../services/weatherService';
import LocationSearch from './LocationSearch';
import CurrentWeather from './CurrentWeather';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import ObservingConditionsPanel from './ObservingConditionsPanel';
import WeeklyOverview from './WeeklyOverview';
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
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load default location on mount
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      loadDefaultLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate observing conditions when forecast changes
  useEffect(() => {
    if (forecast?.currentWeather) {
      const conditions = weatherService.calculateObservingConditions(forecast.currentWeather);
      setObservingConditions(conditions);
    }
  }, [forecast]);

  const loadWeatherData = async (lat: number, lon: number, locationName: string) => {
    // Prevent duplicate API calls
    if (loading) return;

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

  const loadDefaultLocation = async () => {
    const defaultLat = parseFloat(process.env.REACT_APP_DEFAULT_LAT || '53.5511');
    const defaultLon = parseFloat(process.env.REACT_APP_DEFAULT_LON || '9.9937');
    const defaultName = process.env.REACT_APP_DEFAULT_LOCATION || 'Hamburg, Germany';

    await loadWeatherData(defaultLat, defaultLon, defaultName);
  };

  const handleLocationSelect = async (location: LocationSearchResult) => {
    if (loading) return; // Prevent duplicate requests
    setSelectedLocation(location);
    await loadWeatherData(location.lat, location.lon, location.name);
  };

  const handleRefresh = () => {
    if (loading) return; // Prevent duplicate requests
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

          {/* Data Availability Notice */}
          {(forecast.hourlyForecast.length === 0 ||
            (forecast.currentWeather.temperature === null &&
             forecast.currentWeather.windSpeed === null &&
             forecast.currentWeather.cloudCover.totalCloudCover === null)) && (
            <div className="data-notice">
              <div className="notice-icon">📡</div>
              <div className="notice-content">
                <h3>Weather Data Not Available</h3>
                <p>
                  Weather data is currently unavailable. This could be due to:
                </p>
                <ul>
                  <li>Missing or invalid Meteoblue API key</li>
                  <li>API rate limit exceeded (500 calls/day limit)</li>
                  <li>Network connectivity issues</li>
                  <li>Temporary API service outage</li>
                </ul>
                <p>
                  To get real weather data, please configure your Meteoblue API key in the <code>.env</code> file.
                  Get your free API key at <a href="https://www.meteoblue.com/en/weather-api" target="_blank" rel="noopener noreferrer">meteoblue.com</a>.
                </p>
              </div>
            </div>
          )}

          {/* Compact 7-Day Overview */}
          <WeeklyOverview hourlyData={forecast.hourlyForecast} />

          {/* Observing Conditions Overview */}
          {observingConditions && forecast.hourlyForecast.length > 0 && (
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
          {forecast.hourlyForecast.length > 0 ? (
            <div className="forecast-section">
              <h3>🕐 Next 24 Hours</h3>
              <HourlyForecast
                hourlyData={forecast.hourlyForecast.slice(0, 24)}
              />
            </div>
          ) : (
            <div className="forecast-section">
              <h3>🕐 Next 24 Hours</h3>
              <div className="no-data-message">
                <div className="no-data-icon">📊</div>
                <div className="no-data-text">
                  <h4>Hourly forecast not available</h4>
                  <p>Configure your Meteoblue API key to access detailed hourly weather data.</p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Forecast */}
          {forecast.dailyForecast.length > 0 ? (
            <div className="forecast-section">
              <h3>📅 7-Day Outlook</h3>
              <DailyForecast
                dailyData={forecast.dailyForecast}
              />
            </div>
          ) : (
            <div className="forecast-section">
              <h3>📅 7-Day Outlook</h3>
              <div className="no-data-message">
                <div className="no-data-icon">📅</div>
                <div className="no-data-text">
                  <h4>Daily forecast not available</h4>
                  <p>Configure your Meteoblue API key to access extended weather forecasts.</p>
                </div>
              </div>
            </div>
          )}

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
