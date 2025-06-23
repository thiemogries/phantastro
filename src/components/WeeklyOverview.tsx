import React from 'react';
import { HourlyForecast } from '../types/weather';
import {
  formatTime,
  getCloudCoverageInfo,
  getObservingQualityColor,
  getRainState
} from '../utils/weatherUtils';
import './WeeklyOverview.css';

interface WeeklyOverviewProps {
  hourlyData: HourlyForecast[];
  className?: string;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  hourlyData,
  className
}) => {


  // Group hourly data by day
  const groupedByDay = React.useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return [];

    const days: { [key: string]: HourlyForecast[] } = {};
    hourlyData.slice(0, 168).forEach(hour => { // 7 days * 24 hours = 168
      const date = hour.time.split('T')[0];
      if (!days[date]) days[date] = [];
      days[date].push(hour);
    });

    return Object.entries(days).slice(0, 7).map(([date, hours]) => ({
      date,
      hours: hours.slice(0, 24) // Ensure max 24 hours per day
    }));
  }, [hourlyData]);

  if (groupedByDay.length === 0) {
    return (
      <div className={`weekly-overview ${className || ''}`}>
        <div className="no-data-compact">
          <span className="no-data-icon">📊</span>
          <span>7-day hourly overview not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`weekly-overview ${className || ''}`}>
      <div className="overview-header">
        <h3>📅 7-Day Hourly Observing Outlook</h3>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot excellent"></div>
            <span>Excellent</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot good"></div>
            <span>Good</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot fair"></div>
            <span>Fair</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot poor"></div>
            <span>Poor</span>
          </div>
        </div>
        <div className="legend-note">
          <small>🌙 Moonlight: Lower is better for deep sky observations</small>
        </div>
      </div>

      <div className="hourly-overview-container">
        {groupedByDay.map(({ date, hours }, dayIndex) => {
          const dayName = new Date(date).toLocaleDateString([], { weekday: 'short' });
          const dayDate = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div key={date} className="day-section">
              <div className="day-header-hourly">
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayDate}</div>
              </div>

              <div className="hourly-strip">
                {/* Time labels */}
                <div className="time-labels">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="time-label">
                      {i.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* Cloud coverage row */}
                <div className="hourly-row cloud-row">
                  <div className="row-label">☁️</div>
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const cloudInfo = getCloudCoverageInfo(hour.cloudCover.totalCloudCover);
                      const opacity = hour.cloudCover.totalCloudCover ? hour.cloudCover.totalCloudCover / 100 : 0;

                      return (
                        <div
                          key={i}
                          className="hourly-cell cloud-cell"
                          style={{
                            backgroundColor: cloudInfo.color,
                            opacity: opacity
                          }}
                          title={`${formatTime(hour.time)}: ${hour.cloudCover.totalCloudCover !== null ? Math.round(hour.cloudCover.totalCloudCover) : 'N/A'}% clouds`}
                        ></div>
                      );
                    })}
                  </div>
                </div>



                {/* Precipitation row */}
                <div className="hourly-row precip-row">
                  <div className="row-label">🌧️</div>
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const rainState = getRainState(hour.precipitation.precipitationProbability);

                      return (
                        <div
                          key={i}
                          className={`hourly-cell precip-cell ${rainState.hasRain ? 'has-rain' : ''}`}
                          style={{
                            backgroundColor: rainState.hasRain ? '#3b82f6' : 'transparent',
                            opacity: rainState.hasRain ? Math.max(0.3, rainState.intensity) : 0.1
                          }}
                          title={`${formatTime(hour.time)}: ${hour.precipitation.precipitationProbability !== null ? hour.precipitation.precipitationProbability + '% chance' : 'N/A'} of rain`}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Visibility row */}
                <div className="hourly-row visibility-row">
                  <div className="row-label">👁️</div>
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const visibility = hour.visibility;
                      const hasVisibility = visibility !== null && visibility !== undefined;

                      // Good visibility is >20km, poor is <5km
                      const visibilityQuality = hasVisibility
                        ? visibility > 20 ? 'excellent'
                          : visibility > 15 ? 'good'
                          : visibility > 10 ? 'fair'
                          : 'poor'
                        : 'poor';

                      const visibilityColor = getObservingQualityColor(visibilityQuality);
                      const opacity = hasVisibility ? Math.min(1, Math.max(0.3, visibility / 30)) : 0.2;

                      return (
                        <div
                          key={i}
                          className="hourly-cell visibility-cell"
                          style={{
                            backgroundColor: visibilityColor,
                            opacity
                          }}
                          title={`${formatTime(hour.time)}: ${hasVisibility ? `${visibility.toFixed(1)}km` : 'N/A'} visibility`}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Moonlight row */}
                <div className="hourly-row moonlight-row">
                  <div className="row-label">🌙</div>
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const moonlight = hour.moonlight?.moonlightActual;
                      const hasMoonlight = moonlight !== null && moonlight !== undefined;

                      // Moonlight intensity: 0% = new moon (best for deep sky), 100% = full moon (worst for deep sky)
                      // For astronomical observation, lower moonlight is better
                      const moonlightQuality = hasMoonlight
                        ? moonlight < 10 ? 'excellent'  // Dark skies, ideal for deep sky
                          : moonlight < 25 ? 'good'     // Some moonlight, still good
                          : moonlight < 50 ? 'fair'     // Moderate moonlight
                          : 'poor'                      // Bright moonlight, poor for deep sky
                        : 'poor';

                      const moonlightColor = getObservingQualityColor(moonlightQuality);
                      // Higher moonlight = higher opacity (more interference)
                      const opacity = hasMoonlight ? Math.min(1, Math.max(0.2, moonlight / 100)) : 0.2;

                      return (
                        <div
                          key={i}
                          className="hourly-cell moonlight-cell"
                          style={{
                            backgroundColor: moonlightColor,
                            opacity
                          }}
                          title={`${formatTime(hour.time)}: ${hasMoonlight ? `${moonlight.toFixed(1)}%` : 'N/A'} moonlight`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Row */}
      <div className="overview-summary">
        <div className="summary-item">
          <span className="summary-label">Best Hours:</span>
          <span className="summary-value">
            {hourlyData
              .filter(hour => hour.cloudCover.totalCloudCover !== null && hour.windSpeed !== null && hour.cloudCover.totalCloudCover < 30 && hour.windSpeed < 10)
              .length} clear hours
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Clouds:</span>
          <span className="summary-value">
            {hourlyData.length > 0
              ? `${Math.round(hourlyData.filter(h => h.cloudCover.totalCloudCover !== null).reduce((sum, hour) => sum + (hour.cloudCover.totalCloudCover || 0), 0) / hourlyData.filter(h => h.cloudCover.totalCloudCover !== null).length)}%`
              : 'N/A'
            }
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Clear Periods:</span>
          <span className="summary-value">
            {hourlyData.filter(hour => hour.cloudCover.totalCloudCover !== null && hour.cloudCover.totalCloudCover < 20).length}h total
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Visibility:</span>
          <span className="summary-value">
            {hourlyData.filter(h => h.visibility !== null).length > 0
              ? `${(hourlyData.filter(h => h.visibility !== null).reduce((sum, hour) => sum + (hour.visibility || 0), 0) / hourlyData.filter(h => h.visibility !== null).length).toFixed(1)}km`
              : 'N/A'
            }
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Dark Hours:</span>
          <span className="summary-value">
            {hourlyData.filter(hour => hour.moonlight?.moonlightActual !== null && hour.moonlight.moonlightActual < 25).length}h moonlight &lt;25%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Moonlight:</span>
          <span className="summary-value">
            {hourlyData.filter(h => h.moonlight?.moonlightActual !== null).length > 0
              ? `${Math.round(hourlyData.filter(h => h.moonlight?.moonlightActual !== null).reduce((sum, hour) => sum + (hour.moonlight?.moonlightActual || 0), 0) / hourlyData.filter(h => h.moonlight?.moonlightActual !== null).length)}%`
              : 'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOverview;
