import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { HourlyForecast, DailyForecast } from '../types/weather';
import {
  getCloudCoverageInfo,
  getRainState
} from '../utils/weatherUtils';
import './WeeklyOverview.css';

interface WeeklyOverviewProps {
  hourlyData: HourlyForecast[];
  dailyData?: DailyForecast[]; // Daily forecast data with sun/moon times
  className?: string;
}

// Helper functions for tooltip content
const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getVisibilityQuality = (vis: number | null | undefined) => {
  if (vis === null || vis === undefined) return 'N/A';
  if (vis >= 20) return 'Good';
  if (vis >= 10) return 'Moderate';
  return 'Poor';
};

const getCloudDescription = (clouds: number | null | undefined) => {
  if (clouds === null || clouds === undefined) return 'N/A';
  if (clouds >= 75) return 'Overcast';
  if (clouds >= 50) return 'Mostly Cloudy';
  if (clouds >= 25) return 'Partly Cloudy';
  return 'Clear';
};

const getRainDescription = (precipitation: number | null | undefined, probability: number | null | undefined) => {
  if ((precipitation === null || precipitation === undefined) && (probability === null || probability === undefined)) return 'N/A';
  if (precipitation && precipitation > 0) {
    if (precipitation >= 2.5) return 'Heavy Rain';
    if (precipitation >= 0.5) return 'Moderate Rain';
    return 'Light Rain';
  }
  if (probability && probability > 60) return 'High Chance';
  if (probability && probability > 30) return 'Moderate Chance';
  if (probability && probability > 0) return 'Low Chance';
  return 'No Rain';
};

const getTooltipContent = (hour: HourlyForecast): string => {
  const time = formatTime(hour.time);
  const clouds = `${hour.cloudCover.totalCloudCover?.toFixed(0) ?? 'N/A'}% (${getCloudDescription(hour.cloudCover.totalCloudCover)})`;
  const rain = `${hour.precipitation.precipitationProbability?.toFixed(0) ?? 'N/A'}% (${getRainDescription(hour.precipitation.precipitation, hour.precipitation.precipitationProbability)})`;
  const visibility = `${hour.visibility?.toFixed(1) ?? 'N/A'}km (${getVisibilityQuality(hour.visibility)})`;
  const moonlight = `${hour.moonlight?.moonlightClearSky?.toFixed(1) ?? 'N/A'}%`;
  const wind = `${hour.windSpeed?.toFixed(1) ?? 'N/A'} m/s`;
  const temperature = hour.temperature !== null ? `<div>🌡️ Temp: ${hour.temperature.toFixed(1)}°C</div>` : '';

  return `
    <div style="font-size: 0.75rem; line-height: 1.4;">
      <div style="font-weight: bold; margin-bottom: 4px;">${time}</div>
      <div>☁️ Clouds: ${clouds}</div>
      <div>🌧️ Rain: ${rain}</div>
      <div>👁️ Visibility: ${visibility}</div>
      <div>🌙 Moonlight: ${moonlight}</div>
      <div>💨 Wind: ${wind}</div>
      ${temperature}
    </div>
  `;
};

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  hourlyData,
  dailyData,
  className
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);


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
      hours: hours.slice(0, 24), // Ensure max 24 hours per day
      sunMoon: dailyData?.find(day => day.date === date)?.sunMoon
    }));
  }, [hourlyData, dailyData]);

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
        <h3>7-Day Hourly Outlook</h3>
      </div>

      <div className="weekly-grid">
        {/* Header row with day names */}
        <div className="grid-header">
          <div className="row-label"></div>
          {groupedByDay.map(({ date }) => {
            const dayName = new Date(date).toLocaleDateString([], { weekday: 'short' });
            const dayDate = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
            return (
              <div key={date} className="day-header">
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayDate}</div>
              </div>
            );
          })}
        </div>

        {/* Hour labels row */}
        <div className="grid-row hour-labels-row">
          <div className="row-label">Hour</div>
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <div key={dayIndex} className="day-hours">
              {Array.from({ length: 24 }, (_, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`hour-label ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHoveredHour(hourIndex)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {hourIndex.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Cloud coverage row */}
        <div className="grid-row clouds-row">
          <div className="row-label">☁️ Clouds</div>
          {groupedByDay.map(({ date, hours }) => (
            <div key={`clouds-${date}`} className="day-hours">
              {Array.from({ length: 24 }, (_, hourIndex) => {
                const hour = hours[hourIndex];
                if (!hour) {
                  return (
                    <div
                      key={hourIndex}
                      className={`hour-cell empty ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredHour(hourIndex)}
                      onMouseLeave={() => setHoveredHour(null)}
                    ></div>
                  );
                }

                const cloudInfo = getCloudCoverageInfo(hour.cloudCover.totalCloudCover);
                const opacity = hour.cloudCover.totalCloudCover !== null ?
                  Math.max(0.2, hour.cloudCover.totalCloudCover / 100) : 0.1;

                return (
                  <div
                    key={hourIndex}
                    className={`hour-cell cloud-cell ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: cloudInfo.color,
                      opacity: opacity
                    }}
                    data-tooltip-id="hour-tooltip"
                    data-tooltip-html={getTooltipContent(hour)}
                    onMouseEnter={() => setHoveredHour(hourIndex)}
                    onMouseLeave={() => setHoveredHour(null)}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Precipitation row */}
        <div className="grid-row precipitation-row">
          <div className="row-label">🌧️ Rain</div>
          {groupedByDay.map(({ date, hours }) => (
            <div key={`rain-${date}`} className="day-hours">
              {Array.from({ length: 24 }, (_, hourIndex) => {
                const hour = hours[hourIndex];
                if (!hour) {
                  return (
                    <div
                      key={hourIndex}
                      className={`hour-cell empty ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredHour(hourIndex)}
                      onMouseLeave={() => setHoveredHour(null)}
                    ></div>
                  );
                }

                const rainState = getRainState(hour.precipitation.precipitationProbability);

                return (
                  <div
                    key={hourIndex}
                    className={`hour-cell precip-cell ${rainState.hasRain ? 'has-rain' : ''} ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: rainState.hasRain ? '#3b82f6' : 'transparent',
                      opacity: rainState.hasRain ? Math.max(0.3, rainState.intensity) : 0.1
                    }}
                    data-tooltip-id="hour-tooltip"
                    data-tooltip-html={getTooltipContent(hour)}
                    onMouseEnter={() => setHoveredHour(hourIndex)}
                    onMouseLeave={() => setHoveredHour(null)}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Visibility row */}
        <div className="grid-row visibility-row">
          <div className="row-label">👁️ Visibility</div>
          {groupedByDay.map(({ date, hours }) => (
            <div key={`visibility-${date}`} className="day-hours">
              {Array.from({ length: 24 }, (_, hourIndex) => {
                const hour = hours[hourIndex];
                if (!hour) {
                  return (
                    <div
                      key={hourIndex}
                      className={`hour-cell empty ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredHour(hourIndex)}
                      onMouseLeave={() => setHoveredHour(null)}
                    ></div>
                  );
                }

                const visibility = hour.visibility;
                const hasVisibility = visibility !== null && visibility !== undefined;

                const getVisibilityColor = (vis: number): string => {
                  if (vis >= 20) {
                    return '#22c55e'; // Green for good visibility (≥20km)
                  } else if (vis >= 10) {
                    return '#f59e0b'; // Orange for moderate visibility (10-19km)
                  } else {
                    return '#ef4444'; // Red for poor visibility (<10km)
                  }
                };

                const visibilityColor = hasVisibility ? getVisibilityColor(visibility) : '#6b7280';
                const opacity = hasVisibility ? Math.min(1.0, Math.max(0.5, 0.5 + (visibility / 40))) : 0.3;

                return (
                  <div
                    key={hourIndex}
                    className={`hour-cell visibility-cell ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: visibilityColor,
                      opacity
                    }}
                    data-tooltip-id="hour-tooltip"
                    data-tooltip-html={getTooltipContent(hour)}
                    onMouseEnter={() => setHoveredHour(hourIndex)}
                    onMouseLeave={() => setHoveredHour(null)}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Moonlight row */}
        <div className="grid-row moonlight-row">
          <div className="row-label">🌙 Moonlight</div>
          {groupedByDay.map(({ date, hours }) => (
            <div key={`moonlight-${date}`} className="day-hours">
              {Array.from({ length: 24 }, (_, hourIndex) => {
                const hour = hours[hourIndex];
                if (!hour) {
                  return (
                    <div
                      key={hourIndex}
                      className={`hour-cell empty ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredHour(hourIndex)}
                      onMouseLeave={() => setHoveredHour(null)}
                    ></div>
                  );
                }

                const moonlight = hour.moonlight?.moonlightClearSky;
                const hasMoonlight = moonlight !== null && moonlight !== undefined;

                const opacity = hasMoonlight && moonlight > 0
                  ? Math.min(1, 0.2 + (moonlight / 100) * 0.8)
                  : 0;

                return (
                  <div
                    key={hourIndex}
                    className={`hour-cell moonlight-cell ${hoveredHour === hourIndex ? 'highlighted' : ''}`}
                    style={{
                      backgroundColor: '#4338ca',
                      opacity
                    }}
                    data-tooltip-id="hour-tooltip"
                    data-tooltip-html={getTooltipContent(hour)}
                    onMouseEnter={() => setHoveredHour(hourIndex)}
                    onMouseLeave={() => setHoveredHour(null)}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sun rise/set row */}
        <div className="grid-row sun-row">
          <div className="row-label">☀️ Sun</div>
          {groupedByDay.map(({ date, sunMoon }, dayIndex) => {
            // Parse sun/moon times to hours (with precision for better positioning)
            const parseTimeToHour = (timeStr: string | null | undefined): number => {
              if (!timeStr || timeStr === '---' || timeStr === '----') return -1;
              if (timeStr === '24:00') return 24; // End of day
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours + (minutes / 60); // Precise decimal hours for better positioning
            };

            const sunriseHour = parseTimeToHour(sunMoon?.sunrise);
            const sunsetHour = parseTimeToHour(sunMoon?.sunset);

            return (
              <div key={`sun-${date}`} className="day-timeline">
                <div className="timeline-track">
                  {/* Handle all-day sun case */}
                  {(sunriseHour === 0 && sunsetHour === 24) || (sunriseHour === -1 && sunsetHour === -1) ? (
                    <div
                      className="sun-line"
                      style={{
                        left: '0%',
                        width: '100%',
                        display: 'block'
                      }}
                      title={`Sun: All day${sunMoon?.sunrise ? ` (${sunMoon.sunrise} - ${sunMoon.sunset})` : ''}`}
                    />
                  ) : sunriseHour > sunsetHour && sunriseHour !== -1 && sunsetHour !== -1 && sunsetHour !== 24 ? (
                    // Sun crosses midnight - show two segments
                    <>
                      <div
                        className="sun-line"
                        style={{
                          left: '0%',
                          width: `${(sunsetHour / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Sun: ${sunMoon?.sunrise || 'N/A'} - ${sunMoon?.sunset || 'N/A'} (crosses midnight)`}
                      />
                      <div
                        className="sun-line"
                        style={{
                          left: `${(sunriseHour / 24) * 100}%`,
                          width: `${((24 - sunriseHour) / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Sun: ${sunMoon?.sunrise || 'N/A'} - ${sunMoon?.sunset || 'N/A'} (crosses midnight)`}
                      />
                    </>
                  ) : sunriseHour !== -1 && sunsetHour === -1 ? (
                    // Sun rises but doesn't set
                    <div
                      className="sun-line"
                      style={{
                        left: `${(sunriseHour / 24) * 100}%`,
                        width: `${((24 - sunriseHour) / 24) * 100}%`,
                        display: 'block'
                      }}
                      title={`Sun: ${sunMoon?.sunrise} - end of day`}
                    />
                  ) : sunriseHour === -1 && sunsetHour !== -1 ? (
                    // Sun sets but doesn't rise
                    <div
                      className="sun-line"
                      style={{
                        left: '0%',
                        width: `${(sunsetHour / 24) * 100}%`,
                        display: 'block'
                      }}
                      title={`Sun: start of day - ${sunMoon?.sunset}`}
                    />
                  ) : sunriseHour !== -1 && sunsetHour !== -1 ? (
                    // Normal sun period
                    <div
                      className="sun-line"
                      style={{
                        left: `${(sunriseHour / 24) * 100}%`,
                        width: `${((sunsetHour === 24 ? 24 : sunsetHour) - sunriseHour) / 24 * 100}%`,
                        display: 'block'
                      }}
                      title={`Sun: ${sunMoon?.sunrise} - ${sunMoon?.sunset}`}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Moon rise/set row */}
        <div className="grid-row moon-row">
          <div className="row-label">🌙 Moon</div>
          {groupedByDay.map(({ date, sunMoon }, dayIndex) => {
            // Parse sun/moon times to hours (with precision for better positioning)
            const parseTimeToHour = (timeStr: string | null | undefined): number => {
              if (!timeStr || timeStr === '---' || timeStr === '----') return -1;
              if (timeStr === '24:00') return 24; // End of day
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours + (minutes / 60); // Precise decimal hours for better positioning
            };

            const moonriseHour = parseTimeToHour(sunMoon?.moonrise);
            const moonsetHour = parseTimeToHour(sunMoon?.moonset);

            // Determine moon visibility for days with no rise/set events
            const getMoonVisibility = () => {
              // Safety checks for NaN values
              const hasValidRise = moonriseHour !== -1 && !isNaN(moonriseHour);
              const hasValidSet = moonsetHour !== -1 && !isNaN(moonsetHour);

              // If we have both moonrise and moonset, use normal logic
              if (hasValidRise && hasValidSet) {
                return { hasRise: true, hasSet: true };
              }

              // If we have only moonrise, moon is visible from rise to end of day
              if (hasValidRise && !hasValidSet) {
                return { hasRise: true, hasSet: false };
              }

              // If we have only moonset, moon is visible from start of day to set
              if (!hasValidRise && hasValidSet) {
                return { hasRise: false, hasSet: true };
              }

              // If we have neither rise nor set, check surrounding days for moon activity
              const prevDay = dayIndex > 0 ? groupedByDay[dayIndex - 1] : null;
              const nextDay = dayIndex < groupedByDay.length - 1 ? groupedByDay[dayIndex + 1] : null;

              // Check if previous day has moon events
              const prevHasMoonEvents = prevDay?.sunMoon &&
                ((prevDay.sunMoon.moonrise !== null && prevDay.sunMoon.moonrise !== '---' && prevDay.sunMoon.moonrise !== '----') ||
                 (prevDay.sunMoon.moonset !== null && prevDay.sunMoon.moonset !== '---' && prevDay.sunMoon.moonset !== '----'));

              // Check if next day has moon events
              const nextHasMoonEvents = nextDay?.sunMoon &&
                ((nextDay.sunMoon.moonrise !== null && nextDay.sunMoon.moonrise !== '---' && nextDay.sunMoon.moonrise !== '----') ||
                 (nextDay.sunMoon.moonset !== null && nextDay.sunMoon.moonset !== '---' && nextDay.sunMoon.moonset !== '----'));

              // If either adjacent day has moon events, assume all-day visibility
              if (prevHasMoonEvents || nextHasMoonEvents) {
                return { hasRise: false, hasSet: false, allDay: true };
              }

              return { hasRise: false, hasSet: false, allDay: false };
            };

            const moonVisibility = getMoonVisibility();

            return (
              <div key={`moon-${date}`} className="day-timeline">
                <div className="timeline-track">
                  {/* Handle all-day moon case */}
                  {(moonriseHour === 0 && moonsetHour === 24) || moonVisibility.allDay ? (
                    <div
                      className="moon-line"
                      style={{
                        left: '0%',
                        width: '100%',
                        display: 'block'
                      }}
                      title={moonVisibility.allDay
                        ? `Moon: Visible all day (no rise/set events)`
                        : `Moon: All day (${sunMoon?.moonrise} - ${sunMoon?.moonset})`}
                    />
                  ) : moonriseHour > moonsetHour && moonriseHour !== -1 && moonsetHour !== -1 && moonsetHour !== 24 ? (
                    // Moon crosses midnight - show two segments
                    <>
                      <div
                        className="moon-line"
                        style={{
                          left: '0%',
                          width: `${(moonsetHour / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Moon: ${sunMoon?.moonrise || 'N/A'} - ${sunMoon?.moonset || 'N/A'} (crosses midnight)`}
                      />
                      <div
                        className="moon-line"
                        style={{
                          left: `${(moonriseHour / 24) * 100}%`,
                          width: `${((24 - moonriseHour) / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Moon: ${sunMoon?.moonrise || 'N/A'} - ${sunMoon?.moonset || 'N/A'} (crosses midnight)`}
                      />
                    </>
                  ) : moonVisibility.hasRise && !moonVisibility.hasSet ? (
                    // Moon rises but doesn't set
                    <div
                      className="moon-line"
                      style={{
                        left: `${(moonriseHour / 24) * 100}%`,
                        width: `${((24 - moonriseHour) / 24) * 100}%`,
                        display: 'block'
                      }}
                      title={`Moon: ${sunMoon?.moonrise} - end of day (sets later)`}
                    />
                  ) : !moonVisibility.hasRise && moonVisibility.hasSet ? (
                    // Moon sets but doesn't rise
                    <div
                      className="moon-line"
                      style={{
                        left: '0%',
                        width: `${Math.max(5, (moonsetHour / 24) * 100)}%`,
                        display: 'block'
                      }}
                      title={`Moon: start of day - ${sunMoon?.moonset} (rose earlier)`}
                    />
                  ) : moonVisibility.hasRise && moonVisibility.hasSet ? (
                    // Normal moon period
                    <div
                      className="moon-line"
                      style={{
                        left: `${(moonriseHour / 24) * 100}%`,
                        width: `${((moonsetHour === 24 ? 24 : moonsetHour) - moonriseHour) / 24 * 100}%`,
                        display: 'block'
                      }}
                      title={`Moon: ${sunMoon?.moonrise} - ${sunMoon?.moonset}`}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
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
            {hourlyData.filter(hour => hour.moonlight?.moonlightClearSky !== null && hour.moonlight.moonlightClearSky < 25).length}h moonlight &lt;25%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Moonlight:</span>
          <span className="summary-value">
            {hourlyData.filter(h => h.moonlight?.moonlightClearSky !== null).length > 0
              ? `${Math.round(hourlyData.filter(h => h.moonlight?.moonlightClearSky !== null).reduce((sum, hour) => sum + (hour.moonlight?.moonlightClearSky || 0), 0) / hourlyData.filter(h => h.moonlight?.moonlightClearSky !== null).length)}%`
              : 'N/A'
            }
          </span>
        </div>
      </div>

      {/* React Tooltip */}
      <Tooltip
        id="hour-tooltip"
        place="top"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          maxWidth: '300px'
        }}
      />
    </div>
  );
};

export default WeeklyOverview;
