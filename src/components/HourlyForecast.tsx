import React from 'react';
import { HourlyForecast as HourlyData } from '../types/weather';
import {
  formatTime,
  formatTemperature,
  getCloudCoverageInfo,
  getObservingQualityColor,
  getRainState
} from '../utils/weatherUtils';
import './HourlyForecast.css';

interface HourlyForecastProps {
  hourlyData: HourlyData[];
  className?: string;
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hourlyData,
  className
}) => {
  const getObservingQuality = (cloudCover: number | null, windSpeed: number | null): string => {
    if (cloudCover === null || windSpeed === null) return 'poor';
    if (cloudCover < 20 && windSpeed < 8) return 'excellent';
    if (cloudCover < 40 && windSpeed < 12) return 'good';
    if (cloudCover < 70 && windSpeed < 18) return 'fair';
    if (cloudCover < 90) return 'poor';
    return 'impossible';
  };

  return (
    <div className={`hourly-forecast ${className || ''}`}>
      <div className="hourly-scroll-container">
        <div className="hourly-items">
          {hourlyData.map((hour, index) => {
            const cloudInfo = getCloudCoverageInfo(hour.cloudCover.totalCloudCover);
            const quality = getObservingQuality(hour.cloudCover.totalCloudCover, hour.windSpeed);

            return (
              <div key={hour.time} className="hourly-item">
                <div className="hourly-time">
                  {formatTime(hour.time)}
                </div>

                <div className="hourly-icon">
                  {cloudInfo.emoji}
                </div>

                <div className="hourly-temp">
                  {formatTemperature(hour.temperature)}
                </div>

                <div className="hourly-clouds">
                  <div className="cloud-bar">
                    <div
                      className="cloud-fill"
                      style={{
                        height: `${hour.cloudCover.totalCloudCover || 0}%`,
                        backgroundColor: cloudInfo.color,
                        opacity: hour.cloudCover.totalCloudCover ? hour.cloudCover.totalCloudCover / 100 : 0
                      }}
                    ></div>
                  </div>
                  <div className="cloud-percentage">
                    {hour.cloudCover.totalCloudCover === null ? 'N/A' : `${Math.round(hour.cloudCover.totalCloudCover)}%`}
                  </div>
                </div>

                <div className="hourly-wind">
                  <div className="wind-speed">
                    {hour.windSpeed === null ? 'N/A' : `${Math.round(hour.windSpeed * 3.6)} km/h`}
                  </div>
                </div>

                <div
                  className="observing-indicator"
                  style={{
                    backgroundColor: getObservingQualityColor(quality)
                  }}
                  title={`${quality} observing conditions`}
                >
                  <div className="quality-dot"></div>
                </div>

                {(() => {
                  const rainState = getRainState(hour.precipitation.precipitationProbability);
                  return rainState.hasRain && (
                    <div className="precipitation-indicator">
                      🌧️ {hour.precipitation.precipitationProbability}%
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      <div className="hourly-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
          <span>Excellent</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#84cc16' }}></div>
          <span>Good</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#eab308' }}></div>
          <span>Fair</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
          <span>Poor</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Impossible</span>
        </div>
      </div>
    </div>
  );
};

export default HourlyForecast;
