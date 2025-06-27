import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { HourlyForecast, DailyForecast, Location } from "../types/weather";
import { getCloudCoverageInfo, getRainState } from "../utils/weatherUtils";
import {
  calculateTwilightForDate,
  calculateSunriseSunset,
} from "../utils/solarUtils";
import TwilightTimeline from "./TwilightTimeline";
import MoonTimeline from "./MoonTimeline";

import "./WeeklyOverview.css";

interface WeeklyOverviewProps {
  hourlyData: HourlyForecast[];
  dailyData?: DailyForecast[]; // Daily forecast data with sun/moon times
  location: Location; // Location info for timezone-aware formatting
  className?: string;
}

// Helper functions for tooltip content
const formatTime = (timeStr: string, location?: Location) => {
  // Handle null/undefined input
  if (!timeStr) {
    return "--:--";
  }

  // Extract time directly from ISO string to avoid timezone conversion
  // API returns times like "2025-06-23T14:30+02:00" for local timezone
  const timeMatch = timeStr.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    const [, hours, minutes] = timeMatch;
    return `${hours}:${minutes}`;
  }

  // Fallback to Date parsing if format is unexpected
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return "--:--";
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    return "--:--";
  }
};

// Helper function to format day headers consistently with timezone
const formatDayHeader = (dateStr: string, location?: Location) => {
  // For dates like "2025-06-23", create a date that represents the location's timezone
  // We'll use the first hour of the day from our hourly data to get the correct timezone context
  const date = new Date(dateStr + "T12:00:00"); // Use noon to avoid timezone edge cases

  const dayName = date.toLocaleDateString([], { weekday: "short" });
  const dayDate = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return { dayName, dayDate };
};

const getVisibilityQuality = (vis: number | null | undefined) => {
  if (vis === null || vis === undefined) return "N/A";
  if (vis >= 20) return "Good";
  if (vis >= 10) return "Moderate";
  return "Poor";
};

const getCloudDescription = (clouds: number | null | undefined) => {
  if (clouds === null || clouds === undefined) return "N/A";
  if (clouds >= 75) return "Overcast";
  if (clouds >= 50) return "Mostly Cloudy";
  if (clouds >= 25) return "Partly Cloudy";
  return "Clear";
};

const getRainDescription = (
  precipitation: number | null | undefined,
  probability: number | null | undefined,
) => {
  if (
    (precipitation === null || precipitation === undefined) &&
    (probability === null || probability === undefined)
  )
    return "N/A";
  if (precipitation && precipitation > 0) {
    if (precipitation >= 2.5) return "Heavy Rain";
    if (precipitation >= 0.5) return "Moderate Rain";
    return "Light Rain";
  }
  if (probability && probability > 60) return "High Chance";
  if (probability && probability > 30) return "Moderate Chance";
  if (probability && probability > 0) return "Low Chance";
  return "No Rain";
};

// Helper function to format solar, twilight and moon data for tooltips
const getSolarTwilightAndMoonData = (
  date: string,
  location: Location,
  sunMoonData: any,
) => {
  const formatTimeOnly = (timeStr: string | null | undefined) => {
    if (!timeStr || timeStr === "---" || timeStr === "----") return "N/A";
    if (timeStr === "24:00") return "00:00";
    return timeStr;
  };

  const formatTwilightTime = (date: Date | null) => {
    if (!date) return "N/A";
    try {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "N/A";
    }
  };

  // Calculate sunrise/sunset and twilight times for the specific date with error handling
  const targetDate = new Date(date + "T12:00:00");

  // Check if date is valid
  if (isNaN(targetDate.getTime())) {
    return {
      sun: {
        rise: formatTimeOnly(sunMoonData?.sunrise),
        set: formatTimeOnly(sunMoonData?.sunset),
      },
      twilight: {
        civilDusk: "N/A",
        nauticalDusk: "N/A",
        astronomicalDusk: "N/A",
        astronomicalDawn: "N/A",
        nauticalDawn: "N/A",
        civilDawn: "N/A",
      },
      moon: {
        rise: formatTimeOnly(sunMoonData?.moonrise),
        set: formatTimeOnly(sunMoonData?.moonset),
      },
    };
  }

  // Calculate sunrise/sunset as fallback when API data is not available
  let sunriseTime = formatTimeOnly(sunMoonData?.sunrise);
  let sunsetTime = formatTimeOnly(sunMoonData?.sunset);

  if (sunriseTime === "N/A" || sunsetTime === "N/A") {
    try {
      const calculatedSun = calculateSunriseSunset(
        location.lat,
        location.lon,
        targetDate,
      );
      if (sunriseTime === "N/A" && calculatedSun.sunrise) {
        sunriseTime = formatTwilightTime(calculatedSun.sunrise);
      }
      if (sunsetTime === "N/A" && calculatedSun.sunset) {
        sunsetTime = formatTwilightTime(calculatedSun.sunset);
      }
    } catch {
      // Keep "N/A" values if calculation fails
    }
  }

  let twilightData;
  try {
    twilightData = {
      civil: calculateTwilightForDate(
        location.lat,
        location.lon,
        targetDate,
        "civil",
      ),
      nautical: calculateTwilightForDate(
        location.lat,
        location.lon,
        targetDate,
        "nautical",
      ),
      astronomical: calculateTwilightForDate(
        location.lat,
        location.lon,
        targetDate,
        "astronomical",
      ),
    };
  } catch (error) {
    // Handle cases where twilight calculations fail (e.g., polar regions)
    twilightData = {
      civil: { dawn: null, dusk: null },
      nautical: { dawn: null, dusk: null },
      astronomical: { dawn: null, dusk: null },
    };
  }

  return {
    sun: {
      rise: sunriseTime,
      set: sunsetTime,
    },
    twilight: {
      // Evening sequence: sunset -> civil dusk -> nautical dusk -> astronomical dusk
      civilDusk: formatTwilightTime(twilightData.civil.dusk),
      nauticalDusk: formatTwilightTime(twilightData.nautical.dusk),
      astronomicalDusk: formatTwilightTime(twilightData.astronomical.dusk),
      // Morning sequence: astronomical dawn -> nautical dawn -> civil dawn -> sunrise
      astronomicalDawn: formatTwilightTime(twilightData.astronomical.dawn),
      nauticalDawn: formatTwilightTime(twilightData.nautical.dawn),
      civilDawn: formatTwilightTime(twilightData.civil.dawn),
    },
    moon: {
      rise: formatTimeOnly(sunMoonData?.moonrise),
      set: formatTimeOnly(sunMoonData?.moonset),
    },
  };
};

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  hourlyData,
  dailyData,
  location,
  className,
}) => {
  // Group hourly data by day
  const groupedByDay = React.useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return [];
    }

    const days: { [key: string]: HourlyForecast[] } = {};
    hourlyData.slice(0, 168).forEach((hour, index) => {
      // 7 days * 24 hours = 168
      const date = hour.time.split("T")[0];
      if (!days[date]) days[date] = [];
      days[date].push(hour);
    });

    const result = Object.entries(days)
      .slice(0, 7)
      .map(([date, hours]) => ({
        date,
        hours: hours.slice(0, 24), // Ensure max 24 hours per day
        sunMoon: dailyData?.find((day) => day.date === date)?.sunMoon,
      }));

    // Pad with empty days if we have fewer than 7 days
    while (result.length < 7) {
      const lastDate = result[result.length - 1]?.date;
      const nextDate = lastDate
        ? new Date(new Date(lastDate).getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0];

      result.push({
        date: nextDate,
        hours: [],
        sunMoon: undefined,
      });
    }

    return result;
  }, [hourlyData, dailyData]);

  if (groupedByDay.length === 0) {
    return (
      <div className={`weekly-overview ${className || ""}`}>
        <div className="no-data-compact">
          <span className="no-data-icon">📊</span>
          <span>7-day hourly overview not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`weekly-overview ${className || ""}`}>
      <div className="overview-header">
        <h3>7-Day Hourly Outlook</h3>
      </div>

      <div className="weekly-grid">
        {/* Header row with day names */}
        <div className="grid-header">
          {groupedByDay.map(({ date }) => {
            const { dayName, dayDate } = formatDayHeader(date, location);
            return (
              <div key={date} className="day-header">
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayDate}</div>
                {location?.timezone && (
                  <div
                    className="timezone-indicator"
                    style={{ fontSize: "0.6rem", opacity: 0.7 }}
                  >
                    {location.timezone}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Column-based grid structure for CSS-only hover effects */}
        <div className="grid-columns">
          {Array.from({ length: 7 }, (_, dayIndex) => {
            // Create stable key that doesn't change on rerender
            const dayData = groupedByDay[dayIndex];
            const stableKey = dayData?.date || `empty-${dayIndex}`;

            return (
              <div key={stableKey} className="day-column">
                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const hour = dayData?.hours[hourIndex];
                  const tooltipId = `hour-${dayIndex}-${hourIndex}`;
                  const cellKey = `${stableKey}-${hourIndex}`;

                  return (
                    <div
                      key={cellKey}
                      className="hour-column"
                      data-tooltip-id={tooltipId}
                    >
                      {/* Cloud cell */}
                      <div
                        className="hour-cell cloud-cell"
                        style={
                          hour
                            ? {
                                backgroundColor: getCloudCoverageInfo(
                                  hour.cloudCover.totalCloudCover,
                                ).color,
                                opacity:
                                  hour.cloudCover.totalCloudCover !== null
                                    ? hour.cloudCover.totalCloudCover / 100
                                    : 0.1,
                              }
                            : {
                                background: "rgba(255, 255, 255, 0.05)",
                                opacity: 0.3,
                              }
                        }
                      ></div>

                      {/* Precipitation cell */}
                      <div
                        className={`hour-cell precip-cell ${hour && getRainState(hour.precipitation.precipitationProbability).hasRain ? "has-rain" : ""}`}
                        style={
                          hour
                            ? (() => {
                                const rainState = getRainState(
                                  hour.precipitation.precipitationProbability,
                                );
                                return {
                                  backgroundColor: rainState.hasRain
                                    ? "#3b82f6"
                                    : "transparent",
                                  opacity: rainState.hasRain
                                    ? Math.max(0.3, rainState.intensity)
                                    : 0.1,
                                };
                              })()
                            : {
                                background: "rgba(255, 255, 255, 0.05)",
                                opacity: 0.3,
                              }
                        }
                      ></div>

                      {/* Visibility cell */}
                      <div
                        className="hour-cell visibility-cell"
                        style={
                          hour
                            ? (() => {
                                const visibility = hour.visibility;
                                const hasVisibility =
                                  visibility !== null &&
                                  visibility !== undefined;

                                const getVisibilityColor = (
                                  vis: number,
                                ): string => {
                                  if (vis >= 20) return "#22c55e";
                                  else if (vis >= 10) return "#f59e0b";
                                  else return "#ef4444";
                                };

                                const visibilityColor = hasVisibility
                                  ? getVisibilityColor(visibility)
                                  : "#6b7280";
                                const opacity = hasVisibility
                                  ? Math.min(
                                      1.0,
                                      Math.max(0.5, 0.5 + visibility / 40),
                                    )
                                  : 0.3;

                                return {
                                  backgroundColor: visibilityColor,
                                  opacity,
                                };
                              })()
                            : {
                                background: "rgba(255, 255, 255, 0.05)",
                                opacity: 0.3,
                              }
                        }
                      ></div>

                      {/* Moonlight cell */}
                      <div
                        className="hour-cell moonlight-cell"
                        style={
                          hour
                            ? (() => {
                                const moonlight =
                                  hour.moonlight?.moonlightClearSky;
                                const hasMoonlight =
                                  moonlight !== null && moonlight !== undefined;
                                const opacity =
                                  hasMoonlight && moonlight > 0
                                    ? Math.min(1, 0.2 + (moonlight / 10) * 0.8)
                                    : 0;
                                return { backgroundColor: "#4338ca", opacity };
                              })()
                            : {
                                background: "rgba(255, 255, 255, 0.05)",
                                opacity: 0.3,
                              }
                        }
                      ></div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Tooltips for all hour columns - rendered in portal to break out of container */}
        {typeof document !== "undefined" &&
          createPortal(
            groupedByDay.flatMap((day, dayIndex) =>
              day.hours
                .map((hour, hourIndex) => {
                  if (!hour) return null;
                  const tooltipId = `hour-${dayIndex}-${hourIndex}`;
                  return (
                    <Tooltip
                      key={tooltipId}
                      id={tooltipId}
                      place="bottom"
                      offset={10}
                      delayShow={50}
                      delayHide={50}
                      noArrow
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        color: "white",
                        fontSize: "0.75rem",
                        maxWidth: "180px",
                        zIndex: 1000,
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                      }}
                      border="1px solid rgba(255, 255, 255, 0.2)"
                    >
                      <div
                        style={{
                          marginBottom: "8px",
                          fontSize: "0.8rem",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                          paddingBottom: "4px",
                        }}
                      >
                        <strong>{formatTime(hour.time, location)}</strong>
                        {location?.timezone && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              opacity: 0.8,
                              marginLeft: "4px",
                            }}
                          >
                            {location.timezone}
                          </span>
                        )}
                      </div>
                      <div style={{ lineHeight: "1.4" }}>
                        <div style={{ marginBottom: "2px" }}>
                          ☁️ Clouds:{" "}
                          {hour.cloudCover.totalCloudCover?.toFixed(0) ?? "N/A"}
                          % (
                          {getCloudDescription(hour.cloudCover.totalCloudCover)}
                          )
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          🌧️ Rain:{" "}
                          {hour.precipitation.precipitationProbability?.toFixed(
                            0,
                          ) ?? "N/A"}
                          % (
                          {getRainDescription(
                            hour.precipitation.precipitation,
                            hour.precipitation.precipitationProbability,
                          )}
                          )
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          👁️ Visibility: {hour.visibility?.toFixed(1) ?? "N/A"}
                          km ({getVisibilityQuality(hour.visibility)})
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          🌙 Moonlight:{" "}
                          {hour.moonlight?.moonlightClearSky?.toFixed(1) ??
                            "N/A"}
                          %
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          💨 Wind: {hour.windSpeed?.toFixed(1) ?? "N/A"} m/s
                        </div>
                        {hour.temperature !== null && (
                          <div style={{ marginBottom: "4px" }}>
                            🌡️ Temp: {hour.temperature.toFixed(1)}°C
                          </div>
                        )}

                        {/* Solar, Twilight and Moon Data */}
                        {(() => {
                          const dayData = groupedByDay.find(
                            (d) => d.date === day.date,
                          );
                          const solarData = getSolarTwilightAndMoonData(
                            day.date,
                            location,
                            dayData?.sunMoon,
                          );

                          return (
                            <div
                              style={{
                                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                                paddingTop: "4px",
                                marginTop: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  opacity: 0.9,
                                  marginBottom: "3px",
                                  fontWeight: "bold",
                                }}
                              >
                                Daily Times
                              </div>

                              {/* Sun Rise/Set */}
                              <div
                                style={{
                                  marginBottom: "2px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                ☀️ Sunrise: {solarData.sun.rise} | Sunset:{" "}
                                {solarData.sun.set}
                              </div>

                              {/* Moon Rise/Set */}
                              <div
                                style={{
                                  marginBottom: "3px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                🌙 Moonrise: {solarData.moon.rise} | Moonset:{" "}
                                {solarData.moon.set}
                              </div>

                              {/* Evening Twilight */}
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  opacity: 0.8,
                                  marginBottom: "1px",
                                }}
                              >
                                Evening Twilight:
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌅 Civil ends: {solarData.twilight.civilDusk}
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌇 Nautical ends:{" "}
                                {solarData.twilight.nauticalDusk}
                              </div>
                              <div
                                style={{
                                  marginBottom: "3px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                ⭐ Astro ends:{" "}
                                {solarData.twilight.astronomicalDusk}
                              </div>

                              {/* Morning Twilight */}
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  opacity: 0.8,
                                  marginBottom: "1px",
                                }}
                              >
                                Morning Twilight:
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                ⭐ Astro starts:{" "}
                                {solarData.twilight.astronomicalDawn}
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌇 Nautical starts:{" "}
                                {solarData.twilight.nauticalDawn}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌅 Civil starts: {solarData.twilight.civilDawn}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </Tooltip>
                  );
                })
                .filter(Boolean),
            ),
            document.body,
          )}

        {/* Twilight timeline row */}
        <div className="grid-row sun-row">
          <div className="continuous-timeline">
            <TwilightTimeline
              dates={groupedByDay.map((day) => day.date)}
              latitude={location.lat}
              longitude={location.lon}
              sunMoonData={groupedByDay.map((day) => ({
                date: day.date,
                sunrise: day.sunMoon?.sunrise,
                sunset: day.sunMoon?.sunset,
              }))}
            />
          </div>
        </div>

        {/* Moon rise/set row */}
        <div className="grid-row moon-row">
          <div className="continuous-timeline">
            <MoonTimeline
              dates={groupedByDay.map((day) => day.date)}
              sunMoonData={groupedByDay.map((day) => ({
                date: day.date,
                moonrise: day.sunMoon?.moonrise,
                moonset: day.sunMoon?.moonset,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="overview-summary">
        <div className="summary-item">
          <span className="summary-label">Best Hours:</span>
          <span className="summary-value">
            {
              hourlyData.filter(
                (hour) =>
                  hour.cloudCover.totalCloudCover !== null &&
                  hour.windSpeed !== null &&
                  hour.cloudCover.totalCloudCover < 30 &&
                  hour.windSpeed < 10,
              ).length
            }{" "}
            clear hours
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Clouds:</span>
          <span className="summary-value">
            {hourlyData.length > 0
              ? `${Math.round(hourlyData.filter((h) => h.cloudCover.totalCloudCover !== null).reduce((sum, hour) => sum + (hour.cloudCover.totalCloudCover || 0), 0) / hourlyData.filter((h) => h.cloudCover.totalCloudCover !== null).length)}%`
              : "N/A"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Clear Periods:</span>
          <span className="summary-value">
            {
              hourlyData.filter(
                (hour) =>
                  hour.cloudCover.totalCloudCover !== null &&
                  hour.cloudCover.totalCloudCover < 20,
              ).length
            }
            h total
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Visibility:</span>
          <span className="summary-value">
            {hourlyData.filter((h) => h.visibility !== null).length > 0
              ? `${(hourlyData.filter((h) => h.visibility !== null).reduce((sum, hour) => sum + (hour.visibility || 0), 0) / hourlyData.filter((h) => h.visibility !== null).length).toFixed(1)}km`
              : "N/A"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Dark Hours:</span>
          <span className="summary-value">
            {
              hourlyData.filter(
                (hour) =>
                  hour.moonlight?.moonlightClearSky !== null &&
                  hour.moonlight.moonlightClearSky < 25,
              ).length
            }
            h moonlight &lt;25%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Moonlight:</span>
          <span className="summary-value">
            {hourlyData.filter((h) => h.moonlight?.moonlightClearSky !== null)
              .length > 0
              ? `${Math.round(hourlyData.filter((h) => h.moonlight?.moonlightClearSky !== null).reduce((sum, hour) => sum + (hour.moonlight?.moonlightClearSky || 0), 0) / hourlyData.filter((h) => h.moonlight?.moonlightClearSky !== null).length)}%`
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOverview;
