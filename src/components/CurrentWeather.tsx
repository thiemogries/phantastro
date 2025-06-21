import React from 'react';
import { HourlyForecast, ObservingConditions } from '../types/weather';
import {
  formatTemperature,
  formatWind,
  formatCloudCover,
  getCloudCoverageInfo,
  getObservingQualityColor,
  getObservingQualityEmoji,
  formatHumidity,
  calculateDewPoint,
  getVisibilityInfo,
  getPrecipitationEmoji
} from '../utils/weatherUtils';
import './CurrentWeather.css';

interface CurrentWeatherProps {
  weather: HourlyForecast;
  observingConditions: ObservingConditions | null;
  className?: string;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  weather,
  observingConditions,
  className
}) => {
  const cloudInfo = getCloudCoverageInfo(weather.cloudCover.totalCloudCover);
  const dewPoint = calculateDewPoint(weather.temperature, weather.humidity);
  const visibilityInfo = weather.visibility ? getVisibilityInfo(weather.visibility) : null;
  const precipEmoji = getPrecipitationEmoji(weather.precipitation.precipitation, weather.temperature);

  return (
    <div className={`current-weather ${className || ''}`}>
      <div className="current-weather__header">
        <h3>🌡️ Current Conditions</h3>
        <div className="current-time">
          {new Date(weather.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <div className="current-weather__content">
        {/* Main Temperature Display */}
        <div className="temperature-display">
          <div className="temperature-main">
            <span className="temperature-value">
              {formatTemperature(weather.temperature)}
            </span>
            <div className="temperature-details">
              <div className="feels-like">
                Dew Point: {formatTemperature(dewPoint)}
              </div>
              <div className="humidity">
                Humidity: {formatHumidity(weather.humidity)}
              </div>
            </div>
          </div>
          <div className="weather-icon">
            {cloudInfo.emoji}
          </div>
        </div>

        {/* Observing Quality Badge */}
        {observingConditions && (
          <div
            className="observing-quality-badge"
            style={{
              backgroundColor: getObservingQualityColor(observingConditions.overall),
              color: 'white'
            }}
          >
            <span className="quality-emoji">
              {getObservingQualityEmoji(observingConditions.overall)}
            </span>
            <span className="quality-text">
              {observingConditions.overall.charAt(0).toUpperCase() +
               observingConditions.overall.slice(1)} Observing
            </span>
          </div>
        )}

        {/* Weather Details Grid */}
        <div className="weather-details-grid">
          {/* Cloud Coverage */}
          <div className="weather-detail">
            <div className="detail-icon">☁️</div>
            <div className="detail-content">
              <div className="detail-label">Cloud Coverage</div>
              <div className="detail-value">
                {Math.round(weather.cloudCover.totalCloudCover)}%
              </div>
              <div className="detail-description">
                {cloudInfo.description}
              </div>
            </div>
          </div>

          {/* Wind */}
          <div className="weather-detail">
            <div className="detail-icon">💨</div>
            <div className="detail-content">
              <div className="detail-label">Wind</div>
              <div className="detail-value">
                {formatWind(weather.windSpeed, weather.windDirection)}
              </div>
              <div className="detail-description">
                {weather.windSpeed < 5 ? 'Light breeze' :
                 weather.windSpeed < 10 ? 'Moderate' :
                 weather.windSpeed < 15 ? 'Strong' : 'Very strong'}
              </div>
            </div>
          </div>

          {/* Precipitation */}
          <div className="weather-detail">
            <div className="detail-icon">
              {precipEmoji || '🌧️'}
            </div>
            <div className="detail-content">
              <div className="detail-label">Precipitation</div>
              <div className="detail-value">
                {weather.precipitation.precipitation.toFixed(1)} mm
              </div>
              <div className="detail-description">
                {weather.precipitation.precipitationProbability}% chance
              </div>
            </div>
          </div>

          {/* Visibility */}
          {visibilityInfo && (
            <div className="weather-detail">
              <div className="detail-icon">👁️</div>
              <div className="detail-content">
                <div className="detail-label">Visibility</div>
                <div className="detail-value">
                  {weather.visibility?.toFixed(1)} km
                </div>
                <div
                  className="detail-description"
                  style={{ color: visibilityInfo.color }}
                >
                  {visibilityInfo.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cloud Layers Breakdown */}
        <div className="cloud-layers">
          <h4>☁️ Cloud Layers</h4>
          <div className="cloud-layers-grid">
            <div className="cloud-layer">
              <div className="layer-label">Low</div>
              <div className="layer-bar">
                <div
                  className="layer-fill"
                  style={{
                    width: `${weather.cloudCover.lowCloudCover}%`,
                    backgroundColor: '#94a3b8'
                  }}
                ></div>
              </div>
              <div className="layer-value">
                {Math.round(weather.cloudCover.lowCloudCover)}%
              </div>
            </div>
            <div className="cloud-layer">
              <div className="layer-label">Mid</div>
              <div className="layer-bar">
                <div
                  className="layer-fill"
                  style={{
                    width: `${weather.cloudCover.midCloudCover}%`,
                    backgroundColor: '#64748b'
                  }}
                ></div>
              </div>
              <div className="layer-value">
                {Math.round(weather.cloudCover.midCloudCover)}%
              </div>
            </div>
            <div className="cloud-layer">
              <div className="layer-label">High</div>
              <div className="layer-bar">
                <div
                  className="layer-fill"
                  style={{
                    width: `${weather.cloudCover.highCloudCover}%`,
                    backgroundColor: '#475569'
                  }}
                ></div>
              </div>
              <div className="layer-value">
                {Math.round(weather.cloudCover.highCloudCover)}%
              </div>
            </div>
          </div>
        </div>

        {/* Observing Conditions Details */}
        {observingConditions && (
          <div className="observing-details">
            <h4>🔭 Observing Conditions</h4>
            <div className="conditions-scores">
              <div className="condition-score">
                <div className="score-label">Clear Sky</div>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${observingConditions.cloudScore * 10}%`,
                      backgroundColor: getObservingQualityColor(
                        observingConditions.cloudScore > 8 ? 'excellent' :
                        observingConditions.cloudScore > 6 ? 'good' :
                        observingConditions.cloudScore > 4 ? 'fair' : 'poor'
                      )
                    }}
                  ></div>
                </div>
                <div className="score-value">
                  {observingConditions.cloudScore.toFixed(1)}/10
                </div>
              </div>
              <div className="condition-score">
                <div className="score-label">Stability</div>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${observingConditions.windScore * 10}%`,
                      backgroundColor: getObservingQualityColor(
                        observingConditions.windScore > 8 ? 'excellent' :
                        observingConditions.windScore > 6 ? 'good' :
                        observingConditions.windScore > 4 ? 'fair' : 'poor'
                      )
                    }}
                  ></div>
                </div>
                <div className="score-value">
                  {observingConditions.windScore.toFixed(1)}/10
                </div>
              </div>
              <div className="condition-score">
                <div className="score-label">Transparency</div>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${observingConditions.transparencyScore * 10}%`,
                      backgroundColor: getObservingQualityColor(
                        observingConditions.transparencyScore > 8 ? 'excellent' :
                        observingConditions.transparencyScore > 6 ? 'good' :
                        observingConditions.transparencyScore > 4 ? 'fair' : 'poor'
                      )
                    }}
                  ></div>
                </div>
                <div className="score-value">
                  {observingConditions.transparencyScore.toFixed(1)}/10
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {observingConditions.recommendations.length > 0 && (
              <div className="recommendations">
                <div className="recommendations-title">💡 Recommendations:</div>
                <ul className="recommendations-list">
                  {observingConditions.recommendations.map((recommendation, index) => (
                    <li key={index} className="recommendation-item">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWeather;
