import React from 'react';
import { DailyForecast as DailyData } from '../types/weather';
import {
  formatDateRelative,
  formatTemperature,
  getCloudCoverageInfo
} from '../utils/weatherUtils';
import './DailyForecast.css';

interface DailyForecastProps {
  dailyData: DailyData[];
  className?: string;
}

const DailyForecast: React.FC<DailyForecastProps> = ({
  dailyData,
  className
}) => {
  return (
    <div className={`daily-forecast ${className || ''}`}>
      <div className="daily-items">
        {dailyData.map((day, index) => {
          const cloudInfo = getCloudCoverageInfo(day.cloudCoverAvg);

          return (
            <div key={day.date} className="daily-item">
              <div className="daily-date">
                <div className="date-text">
                  {formatDateRelative(day.date)}
                </div>
                <div className="date-full">
                  {new Date(day.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="daily-weather-icon">
                {cloudInfo.emoji}
              </div>

              <div className="daily-temps">
                <div className="temp-high">
                  {formatTemperature(day.temperatureMax)}
                </div>
                <div className="temp-low">
                  {formatTemperature(day.temperatureMin)}
                </div>
              </div>

              <div className="daily-clouds">
                <div className="cloud-info">
                  <div className="cloud-percentage">
                    {Math.round(day.cloudCoverAvg)}%
                  </div>
                  <div className="cloud-description">
                    {cloudInfo.description}
                  </div>
                </div>
                <div className="cloud-bar-container">
                  <div
                    className="cloud-bar-fill"
                    style={{
                      width: `${day.cloudCoverAvg}%`,
                      backgroundColor: cloudInfo.color,
                      opacity: day.cloudCoverAvg ? day.cloudCoverAvg / 100 : 0
                    }}
                  ></div>
                </div>
              </div>



              <div className="daily-details">
                <div className="detail-item">
                  <span className="detail-icon">💨</span>
                  <span className="detail-value">
                    {Math.round(day.windSpeedMax * 3.6)} km/h
                  </span>
                </div>

                {day.precipitationTotal > 0 && (
                  <div className="detail-item">
                    <span className="detail-icon">🌧️</span>
                    <span className="detail-value">
                      {day.precipitationTotal.toFixed(1)}mm
                    </span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-icon">💧</span>
                  <span className="detail-value">
                    {day.precipitationProbability}%
                  </span>
                </div>
              </div>

              {(day.sunrise || day.sunset) && (
                <div className="daily-sun-times">
                  {day.sunrise && (
                    <div className="sun-time">
                      <span className="sun-icon">🌅</span>
                      <span className="sun-value">
                        {new Date(day.sunrise).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  {day.sunset && (
                    <div className="sun-time">
                      <span className="sun-icon">🌇</span>
                      <span className="sun-value">
                        {new Date(day.sunset).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {day.moonPhase !== undefined && (
                <div className="daily-moon">
                  <div className="moon-phase">
                    <span className="moon-icon">🌙</span>
                    <span className="moon-illumination">
                      {Math.round(day.moonPhase * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyForecast;
