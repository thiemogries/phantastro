import React from 'react';
import { HourlyForecast, DailyForecast } from '../types/weather';
import {
  formatTime,
  getCloudCoverageInfo,
  getRainState
} from '../utils/weatherUtils';
import './WeeklyOverview.css';

interface WeeklyOverviewProps {
  hourlyData: HourlyForecast[];
  dailyData?: DailyForecast[]; // Daily forecast data with sun/moon times
  className?: string;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  hourlyData,
  dailyData,
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

      <div className="hourly-overview-container">
        {groupedByDay.map(({ date, hours, sunMoon }, dayIndex) => {
          const dayName = new Date(date).toLocaleDateString([], { weekday: 'short' });
          const dayDate = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

          // Parse sun/moon times to hours (with precision for better positioning)
          const parseTimeToHour = (timeStr: string | null | undefined): number => {
            if (!timeStr || timeStr === '---' || timeStr === '----') return -1;
            if (timeStr === '24:00') return 24; // End of day
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours + (minutes / 60); // Precise decimal hours for better positioning
          };

          const sunriseHour = parseTimeToHour(sunMoon?.sunrise);
          const sunsetHour = parseTimeToHour(sunMoon?.sunset);
          const moonriseHour = parseTimeToHour(sunMoon?.moonrise);
          const moonsetHour = parseTimeToHour(sunMoon?.moonset);

          // Determine sun visibility for days with no rise/set events
          const getSunVisibility = () => {
            // If we have both sunrise and sunset, use normal logic
            if (sunriseHour !== -1 && sunsetHour !== -1) {
              return { hasRise: true, hasSet: true };
            }

            // If we have only sunrise, sun is visible from rise to end of day
            if (sunriseHour !== -1 && sunsetHour === -1) {
              return { hasRise: true, hasSet: false };
            }

            // If we have only sunset, sun is visible from start of day to set
            if (sunriseHour === -1 && sunsetHour !== -1) {
              return { hasRise: false, hasSet: true };
            }

            // If we have neither rise nor set, assume sun is visible all day (polar day)
            return { hasRise: false, hasSet: false, allDay: true };
          };

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
            // If there's moon activity on adjacent days, assume this day has all-day visibility
            const prevDay = dayIndex > 0 ? groupedByDay[dayIndex - 1] : null;
            const nextDay = dayIndex < groupedByDay.length - 1 ? groupedByDay[dayIndex + 1] : null;

            // Check if previous day has moon events
            const prevHasMoonEvents = prevDay?.sunMoon &&
              ((prevDay.sunMoon.moonrise !== null && prevDay.sunMoon.moonrise !== '---') ||
               (prevDay.sunMoon.moonset !== null && prevDay.sunMoon.moonset !== '---'));

            // Check if next day has moon events
            const nextHasMoonEvents = nextDay?.sunMoon &&
              ((nextDay.sunMoon.moonrise !== null && nextDay.sunMoon.moonrise !== '---') ||
               (nextDay.sunMoon.moonset !== null && nextDay.sunMoon.moonset !== '---'));

            // If either adjacent day has moon events, assume all-day visibility
            if (prevHasMoonEvents || nextHasMoonEvents) {
              return { hasRise: false, hasSet: false, allDay: true };
            }

            return { hasRise: false, hasSet: false, allDay: false };
          };

          const sunVisibility = getSunVisibility();
          const moonVisibility = getMoonVisibility();



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
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const visibility = hour.visibility;
                      const hasVisibility = visibility !== null && visibility !== undefined;

                      // Create smooth red-to-green gradient based on visibility distance
                      // Red for poor visibility (<5km), green for excellent visibility (>20km)
                      const getVisibilityColor = (vis: number): string => {
                        // Clamp visibility between 0 and 25km for color calculation
                        const clampedVis = Math.max(0, Math.min(25, vis));
                        const ratio = clampedVis / 25; // 0 = red, 1 = green

                        // Interpolate from red (255,68,68) to green (34,197,94)
                        const red = Math.round(255 - (255 - 34) * ratio);
                        const green = Math.round(68 + (197 - 68) * ratio);
                        const blue = Math.round(68 + (94 - 68) * ratio);

                        return `rgb(${red}, ${green}, ${blue})`;
                      };

                      const visibilityColor = hasVisibility ? getVisibilityColor(visibility) : '#6b7280';
                      // Use consistent opacity for better color visibility, scaling from 0.5 to 1.0
                      const opacity = hasVisibility ? Math.min(1.0, Math.max(0.5, 0.5 + (visibility / 40))) : 0.3;

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
                  <div className="hourly-cells">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = hours[i];
                      if (!hour) {
                        return <div key={i} className="hourly-cell empty"></div>;
                      }

                      const moonlight = hour.moonlight?.moonlightClearSky;
                      const hasMoonlight = moonlight !== null && moonlight !== undefined;

                      // Moonlight intensity: 0% = new moon (best for deep sky), 100% = full moon (worst for deep sky)
                      // Use dark blue/purple for moonlight with transparency for no moonlight
                      const moonlightColor = '#4338ca'; // Dark blue/purple color
                      // Use logarithmic scaling to better show small values while preserving true zero
                      // 0% moonlight = transparent, small values more visible, 100% = fully opaque
                      const opacity = hasMoonlight && moonlight > 0
                        ? Math.min(1, 0.2 + (moonlight / 100) * 0.8) // Min 0.2 for visibility, max 1.0
                        : 0; // True zero remains transparent

                      return (
                        <div
                          key={i}
                          className="hourly-cell moonlight-cell"
                          style={{
                            backgroundColor: moonlightColor,
                            opacity
                          }}
                          title={`${formatTime(hour.time)}: ${hasMoonlight ? `${moonlight.toFixed(2)}%` : 'N/A'} moonlight`}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Sun line */}
                <div className="sun-line-row">
                  <div className="line-track">
                    {/* Handle all-day sun case (either explicit 00:00-24:00 or inferred) */}
                    {(sunriseHour === 0 && sunsetHour === 24) || sunVisibility.allDay ? (
                      <div
                        className="sun-line"
                        style={{
                          left: '0%',
                          width: '100%',
                          display: 'block'
                        }}
                        title={sunVisibility.allDay
                          ? `Sun: Visible all day (polar day)`
                          : `Sun: All day (${sunMoon?.sunrise} - ${sunMoon?.sunset})`}
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
                          title={`Sun: ${sunMoon?.sunrise || 'N/A'} - ${sunMoon?.sunset || 'N/A'} (continues from previous day)`}
                        />
                        <div
                          className="sun-line"
                          style={{
                            left: `${(sunriseHour / 24) * 100}%`,
                            width: `${((24 - sunriseHour) / 24) * 100}%`,
                            display: 'block'
                          }}
                          title={`Sun: ${sunMoon?.sunrise || 'N/A'} - ${sunMoon?.sunset || 'N/A'} (continues to next day)`}
                        />
                      </>
                    ) : sunVisibility.hasRise && !sunVisibility.hasSet ? (
                      // Sun rises but doesn't set - visible from rise to end of day
                      <div
                        className="sun-line"
                        style={{
                          left: `${(sunriseHour / 24) * 100}%`,
                          width: `${((24 - sunriseHour) / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Sun: ${sunMoon?.sunrise} - end of day (polar day)`}
                      />
                    ) : !sunVisibility.hasRise && sunVisibility.hasSet ? (
                      // Sun sets but doesn't rise - visible from start of day to set
                      <div
                        className="sun-line"
                        style={{
                          left: '0%',
                          width: `${(sunsetHour / 24) * 100}%`,
                          display: 'block'
                        }}
                        title={`Sun: start of day - ${sunMoon?.sunset} (polar day)`}
                      />
                    ) : sunVisibility.hasRise && sunVisibility.hasSet ? (
                      // Normal sun period with both rise and set
                      <div
                        className="sun-line"
                        style={{
                          left: `${(sunriseHour / 24) * 100}%`,
                          width: `${((sunsetHour === 24 ? 24 : sunsetHour) - sunriseHour) / 24 * 100}%`,
                          display: 'block'
                        }}
                        title={`Sun: ${sunMoon?.sunrise} - ${sunMoon?.sunset}`}
                      />
                    ) : (
                      // No sun visibility - polar night
                      <div style={{ display: 'none' }} />
                    )}
                  </div>
                </div>

                {/* Moon line */}
                <div className="moon-line-row">
                  <div className="line-track">
                    {/* Handle all-day moon case (either explicit 00:00-24:00 or inferred from neighboring days) */}
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
                          title={`Moon: ${sunMoon?.moonrise || 'N/A'} - ${sunMoon?.moonset || 'N/A'} (continues from previous day)`}
                        />
                        <div
                          className="moon-line"
                          style={{
                            left: `${(moonriseHour / 24) * 100}%`,
                            width: `${((24 - moonriseHour) / 24) * 100}%`,
                            display: 'block'
                          }}
                          title={`Moon: ${sunMoon?.moonrise || 'N/A'} - ${sunMoon?.moonset || 'N/A'} (continues to next day)`}
                        />
                      </>
                    ) : moonVisibility.hasRise && !moonVisibility.hasSet ? (
                      // Moon rises but doesn't set - visible from rise to end of day
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
                      // Moon sets but doesn't rise - visible from start of day to set
                      <div
                        className="moon-line"
                        style={{
                          left: '0%',
                          width: `${Math.max(5, (moonsetHour / 24) * 100)}%`, // Ensure minimum 5% width for visibility
                          display: 'block'
                        }}
                        title={`Moon: start of day - ${sunMoon?.moonset} (rose earlier)`}

                      />
                    ) : moonVisibility.hasRise && moonVisibility.hasSet ? (
                      // Normal moon period with both rise and set
                      <div
                        className="moon-line"
                        style={{
                          left: `${(moonriseHour / 24) * 100}%`,
                          width: `${((moonsetHour === 24 ? 24 : moonsetHour) - moonriseHour) / 24 * 100}%`,
                          display: 'block'
                        }}
                        title={`Moon: ${sunMoon?.moonrise} - ${sunMoon?.moonset}`}

                      />
                    ) : (
                      // No moon visibility - truly no moon this day
                      <div style={{ display: 'none' }} />
                    )}
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
    </div>
  );
};

export default WeeklyOverview;
