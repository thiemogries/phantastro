import React, { useState } from 'react';
import { LocationSearchResult } from '../types/weather';
import {
  useWeatherData,
  useObservingConditions,
  useRefreshWeatherData,
  WeatherQueryParams
} from '../hooks/useWeatherData';
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
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [weatherParams, setWeatherParams] = useState<WeatherQueryParams | null>(null);

  // Initialize with default location
  React.useEffect(() => {
    if (!weatherParams) {
      const defaultLat = parseFloat(process.env.REACT_APP_DEFAULT_LAT || '53.5511');
      const defaultLon = parseFloat(process.env.REACT_APP_DEFAULT_LON || '9.9937');
      const defaultName = process.env.REACT_APP_DEFAULT_LOCATION || 'Hamburg, Germany';

      console.log('🏠 WeatherApp: Loading default location:', { defaultLat, defaultLon, defaultName });
      setWeatherParams({ lat: defaultLat, lon: defaultLon, locationName: defaultName });
    }
  }, [weatherParams]);

  // Use TanStack Query hooks
  const { data: forecast, isLoading: loading, error: queryError } = useWeatherData(weatherParams);
  const { data: observingConditions } = useObservingConditions(forecast);
  const refreshWeatherData = useRefreshWeatherData();

  const error = queryError ? (queryError as Error).message : null;



  const handleLocationSelect = (location: LocationSearchResult) => {
    if (loading) return; // Prevent duplicate requests
    console.log('📍 WeatherApp: Location selected:', location);
    setSelectedLocation(location);
    setWeatherParams({ lat: location.lat, lon: location.lon, locationName: location.name });
  };

  const handleRefresh = () => {
    if (loading || !weatherParams) return; // Prevent duplicate requests
    console.log('🔄 WeatherApp: Refresh requested for:', weatherParams);
    refreshWeatherData.mutate(weatherParams);
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
            observingConditions={observingConditions || null}
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
              onClick={() => {
                const defaultLat = parseFloat(process.env.REACT_APP_DEFAULT_LAT || '53.5511');
                const defaultLon = parseFloat(process.env.REACT_APP_DEFAULT_LON || '9.9937');
                const defaultName = process.env.REACT_APP_DEFAULT_LOCATION || 'Hamburg, Germany';
                setWeatherParams({ lat: defaultLat, lon: defaultLon, locationName: defaultName });
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
