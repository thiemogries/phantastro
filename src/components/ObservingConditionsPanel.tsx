import React from 'react';
import { ObservingConditions, HourlyForecast } from '../types/weather';
import {
  getObservingQualityColor,
  getObservingQualityEmoji,
  formatTemperature,
  formatWind,
  getObservationRecommendations
} from '../utils/weatherUtils';
import './ObservingConditionsPanel.css';

interface ObservingConditionsPanelProps {
  conditions: ObservingConditions;
  currentWeather: HourlyForecast;
  className?: string;
}

const ObservingConditionsPanel: React.FC<ObservingConditionsPanelProps> = ({
  conditions,
  currentWeather,
  className
}) => {
  const recommendations = getObservationRecommendations(currentWeather);

  const getScoreColor = (score: number): string => {
    if (score > 8) return '#22c55e';
    if (score > 6) return '#84cc16';
    if (score > 4) return '#eab308';
    if (score > 2) return '#f97316';
    return '#ef4444';
  };

  const getScoreDescription = (score: number): string => {
    if (score > 8) return 'Excellent';
    if (score > 6) return 'Good';
    if (score > 4) return 'Fair';
    if (score > 2) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className={`observing-conditions-panel ${className || ''}`}>
      <div className="panel-header">
        <h3>🔭 Observing Conditions</h3>
        <div
          className="overall-rating"
          style={{
            backgroundColor: getObservingQualityColor(conditions.overall),
            color: 'white'
          }}
        >
          <span className="rating-emoji">
            {getObservingQualityEmoji(conditions.overall)}
          </span>
          <span className="rating-text">
            {conditions.overall.charAt(0).toUpperCase() + conditions.overall.slice(1)}
          </span>
        </div>
      </div>

      <div className="conditions-grid">
        {/* Sky Clarity */}
        <div className="condition-card">
          <div className="condition-header">
            <div className="condition-icon">🌌</div>
            <div className="condition-title">Sky Clarity</div>
          </div>
          <div className="condition-score">
            <div className="score-circle">
              <div
                className="score-fill"
                style={{
                  background: `conic-gradient(${getScoreColor(conditions.cloudScore)} ${conditions.cloudScore * 36}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="score-inner">
                  {conditions.cloudScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="score-description">
              {getScoreDescription(conditions.cloudScore)}
            </div>
          </div>
          <div className="condition-details">
            <div className="detail-row">
              <span>Cloud Cover:</span>
              <span>{Math.round(currentWeather.cloudCover.totalCloudCover)}%</span>
            </div>
          </div>
        </div>

        {/* Seeing Conditions */}
        <div className="condition-card">
          <div className="condition-header">
            <div className="condition-icon">🌊</div>
            <div className="condition-title">Atmospheric Stability</div>
          </div>
          <div className="condition-score">
            <div className="score-circle">
              <div
                className="score-fill"
                style={{
                  background: `conic-gradient(${getScoreColor(conditions.seeingScore)} ${conditions.seeingScore * 36}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="score-inner">
                  {conditions.seeingScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="score-description">
              {getScoreDescription(conditions.seeingScore)}
            </div>
          </div>
          <div className="condition-details">
            <div className="detail-row">
              <span>Wind Speed:</span>
              <span>{Math.round(currentWeather.windSpeed * 3.6)} km/h</span>
            </div>
          </div>
        </div>

        {/* Transparency */}
        <div className="condition-card">
          <div className="condition-header">
            <div className="condition-icon">👁️</div>
            <div className="condition-title">Transparency</div>
          </div>
          <div className="condition-score">
            <div className="score-circle">
              <div
                className="score-fill"
                style={{
                  background: `conic-gradient(${getScoreColor(conditions.transparencyScore)} ${conditions.transparencyScore * 36}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="score-inner">
                  {conditions.transparencyScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="score-description">
              {getScoreDescription(conditions.transparencyScore)}
            </div>
          </div>
          <div className="condition-details">
            <div className="detail-row">
              <span>Humidity:</span>
              <span>{Math.round(currentWeather.humidity)}%</span>
            </div>
          </div>
        </div>

        {/* Wind Stability */}
        <div className="condition-card">
          <div className="condition-header">
            <div className="condition-icon">💨</div>
            <div className="condition-title">Equipment Stability</div>
          </div>
          <div className="condition-score">
            <div className="score-circle">
              <div
                className="score-fill"
                style={{
                  background: `conic-gradient(${getScoreColor(conditions.windScore)} ${conditions.windScore * 36}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="score-inner">
                  {conditions.windScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="score-description">
              {getScoreDescription(conditions.windScore)}
            </div>
          </div>
          <div className="condition-details">
            <div className="detail-row">
              <span>Wind:</span>
              <span>{formatWind(currentWeather.windSpeed, currentWeather.windDirection, 'kmh')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Type Recommendations */}
      <div className="observation-types">
        <h4>🎯 Recommended Observations</h4>
        <div className="observation-grid">
          <div className={`observation-type ${recommendations.planetary ? 'suitable' : 'not-suitable'}`}>
            <div className="observation-icon">🪐</div>
            <div className="observation-label">Planetary</div>
            <div className="observation-status">
              {recommendations.planetary ? '✅ Good' : '❌ Poor'}
            </div>
          </div>
          <div className={`observation-type ${recommendations.deepSky ? 'suitable' : 'not-suitable'}`}>
            <div className="observation-icon">🌌</div>
            <div className="observation-label">Deep Sky</div>
            <div className="observation-status">
              {recommendations.deepSky ? '✅ Good' : '❌ Poor'}
            </div>
          </div>
          <div className={`observation-type ${recommendations.photography ? 'suitable' : 'not-suitable'}`}>
            <div className="observation-icon">📸</div>
            <div className="observation-label">Astrophotography</div>
            <div className="observation-status">
              {recommendations.photography ? '✅ Good' : '❌ Poor'}
            </div>
          </div>
          <div className={`observation-type ${recommendations.lunar ? 'suitable' : 'not-suitable'}`}>
            <div className="observation-icon">🌙</div>
            <div className="observation-label">Lunar</div>
            <div className="observation-status">
              {recommendations.lunar ? '✅ Good' : '❌ Poor'}
            </div>
          </div>
          <div className={`observation-type ${recommendations.solar ? 'suitable' : 'not-suitable'}`}>
            <div className="observation-icon">☀️</div>
            <div className="observation-label">Solar</div>
            <div className="observation-status">
              {recommendations.solar ? '✅ Good' : '❌ Poor'}
            </div>
          </div>
        </div>
      </div>

      {/* Moon Interference */}
      <div className="moon-interference">
        <h4>🌙 Moon Interference</h4>
        <div className="interference-level">
          <span className="interference-icon">
            {conditions.moonInterference === 'none' ? '🌑' :
             conditions.moonInterference === 'minimal' ? '🌒' :
             conditions.moonInterference === 'moderate' ? '🌓' :
             conditions.moonInterference === 'significant' ? '🌔' : '🌕'}
          </span>
          <span className="interference-text">
            {conditions.moonInterference.charAt(0).toUpperCase() + conditions.moonInterference.slice(1)} Interference
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {conditions.recommendations.length > 0 && (
        <div className="recommendations-panel">
          <h4>💡 Tips & Recommendations</h4>
          <ul className="recommendations-list">
            {conditions.recommendations.map((recommendation, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-bullet">•</span>
                <span className="recommendation-text">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-label">Temperature</div>
          <div className="stat-value">{formatTemperature(currentWeather.temperature)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Precipitation</div>
          <div className="stat-value">{currentWeather.precipitation.precipitationProbability}%</div>
        </div>
        {currentWeather.visibility && (
          <div className="stat-item">
            <div className="stat-label">Visibility</div>
            <div className="stat-value">{currentWeather.visibility.toFixed(1)} km</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservingConditionsPanel;
