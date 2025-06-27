import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { HourlyForecast, DailyForecast, Location } from "../types/weather";
import {
  getCloudCoverageInfo,
  getRainState,
  getMoonPhaseEmoji,
} from "../utils/weatherUtils";
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
const formatDayHeader = (
  dateStr: string,
  location?: Location,
  sunMoon?: any,
) => {
  // For dates like "2025-06-23", create a date that represents the location's timezone
  // We'll use the first hour of the day from our hourly data to get the correct timezone context
  const date = new Date(dateStr + "T12:00:00"); // Use noon to avoid timezone edge cases

  const dayName = date.toLocaleDateString([], { weekday: "short" });
  const dayDate = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  // Get moon phase emoji if available
  const moonPhaseEmoji = sunMoon?.moonPhaseName
    ? getMoonPhaseEmoji(sunMoon.moonPhaseName)
    : "";

  return { dayName, dayDate, moonPhaseEmoji };
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
  hourTime: string,
  location: Location,
  groupedByDay: any[],
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

  // Parse the current hour time to determine which observing cycle we're in
  const currentHour = new Date(hourTime);
  if (isNaN(currentHour.getTime())) {
    return {
      sun: { rise: "N/A", set: "N/A" },
      twilight: {
        civilDusk: "N/A",
        nauticalDusk: "N/A",
        astronomicalDusk: "N/A",
        astronomicalDawn: "N/A",
        nauticalDawn: "N/A",
        civilDawn: "N/A",
      },
      moon: { rise: "N/A", set: "N/A" },
      dayLabels: {
        startDay: "",
        endDay: "",
      },
    };
  }

  // Find the current day and next day data
  const currentDayIndex = groupedByDay.findIndex((day) => day.date === date);
  const currentDayData = groupedByDay[currentDayIndex];
  const nextDayData =
    currentDayIndex < groupedByDay.length - 1
      ? groupedByDay[currentDayIndex + 1]
      : null;
  const prevDayData =
    currentDayIndex > 0 ? groupedByDay[currentDayIndex - 1] : null;

  // Helper to get sunrise time for a day
  const getSunriseTime = (dayData: any) => {
    if (!dayData?.sunMoon?.sunrise || dayData.sunMoon.sunrise === "N/A") {
      try {
        const targetDate = new Date(dayData.date + "T12:00:00");
        const calculatedSun = calculateSunriseSunset(
          location.lat,
          location.lon,
          targetDate,
        );
        return calculatedSun.sunrise
          ? formatTwilightTime(calculatedSun.sunrise)
          : "N/A";
      } catch {
        return "N/A";
      }
    }
    return formatTimeOnly(dayData.sunMoon.sunrise);
  };

  // Helper to get sunset time for a day
  const getSunsetTime = (dayData: any) => {
    if (!dayData?.sunMoon?.sunset || dayData.sunMoon.sunset === "N/A") {
      try {
        const targetDate = new Date(dayData.date + "T12:00:00");
        const calculatedSun = calculateSunriseSunset(
          location.lat,
          location.lon,
          targetDate,
        );
        return calculatedSun.sunset
          ? formatTwilightTime(calculatedSun.sunset)
          : "N/A";
      } catch {
        return "N/A";
      }
    }
    return formatTimeOnly(dayData.sunMoon.sunset);
  };

  // Determine the observing cycle based on current time
  const currentSunrise = getSunriseTime(currentDayData);
  const nextSunrise = nextDayData ? getSunriseTime(nextDayData) : "N/A";

  // Parse times to compare
  const parseTimeToMinutes = (timeStr: string) => {
    if (timeStr === "N/A") return -1;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const currentTimeMinutes =
    currentHour.getHours() * 60 + currentHour.getMinutes();
  const currentSunriseMinutes = parseTimeToMinutes(currentSunrise);

  // Determine if we're in the current day's cycle or spanning to next day
  let cycleStartDay, cycleEndDay, cycleStartSunrise, cycleEndSunrise;

  if (
    currentSunriseMinutes !== -1 &&
    currentTimeMinutes >= currentSunriseMinutes
  ) {
    // We're after today's sunrise, so cycle is from today's sunrise to tomorrow's sunrise
    cycleStartDay = currentDayData;
    cycleEndDay = nextDayData;
    cycleStartSunrise = currentSunrise;
    cycleEndSunrise = nextSunrise;
  } else {
    // We're before today's sunrise, so cycle is from yesterday's sunrise to today's sunrise
    cycleStartDay = prevDayData;
    cycleEndDay = currentDayData;
    cycleStartSunrise = prevDayData ? getSunriseTime(prevDayData) : "N/A";
    cycleEndSunrise = currentSunrise;
  }

  // Get sunset and twilight times for both days
  const startDayTargetDate = cycleStartDay
    ? new Date(cycleStartDay.date + "T12:00:00")
    : null;
  const endDayTargetDate = cycleEndDay
    ? new Date(cycleEndDay.date + "T12:00:00")
    : null;

  // Format day names for display
  const formatDayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T12:00:00");
      return date.toLocaleDateString([], { weekday: "short" });
    } catch {
      return "";
    }
  };

  const startDayName = cycleStartDay ? formatDayName(cycleStartDay.date) : "";
  const endDayName = cycleEndDay ? formatDayName(cycleEndDay.date) : "";

  // Calculate twilight times for the cycle
  let startDayTwilight, endDayTwilight;

  try {
    startDayTwilight = startDayTargetDate
      ? {
          civil: calculateTwilightForDate(
            location.lat,
            location.lon,
            startDayTargetDate,
            "civil",
          ),
          nautical: calculateTwilightForDate(
            location.lat,
            location.lon,
            startDayTargetDate,
            "nautical",
          ),
          astronomical: calculateTwilightForDate(
            location.lat,
            location.lon,
            startDayTargetDate,
            "astronomical",
          ),
        }
      : null;
  } catch {
    startDayTwilight = null;
  }

  try {
    endDayTwilight = endDayTargetDate
      ? {
          civil: calculateTwilightForDate(
            location.lat,
            location.lon,
            endDayTargetDate,
            "civil",
          ),
          nautical: calculateTwilightForDate(
            location.lat,
            location.lon,
            endDayTargetDate,
            "nautical",
          ),
          astronomical: calculateTwilightForDate(
            location.lat,
            location.lon,
            endDayTargetDate,
            "astronomical",
          ),
        }
      : null;
  } catch {
    endDayTwilight = null;
  }

  // Get sunset from the start day and sunrise from end day
  const cycleStartSunset = cycleStartDay ? getSunsetTime(cycleStartDay) : "N/A";

  // Get moon rise/set for the current calendar day (not the cycle)
  const currentMoonRise = formatTimeOnly(currentDayData?.sunMoon?.moonrise);
  const currentMoonSet = formatTimeOnly(currentDayData?.sunMoon?.moonset);

  return {
    sun: {
      rise: cycleStartSunrise,
      set: cycleStartSunset,
      nextRise: cycleEndSunrise,
    },
    twilight: {
      // Evening sequence from start day
      civilDusk: startDayTwilight
        ? formatTwilightTime(startDayTwilight.civil.dusk)
        : "N/A",
      nauticalDusk: startDayTwilight
        ? formatTwilightTime(startDayTwilight.nautical.dusk)
        : "N/A",
      astronomicalDusk: startDayTwilight
        ? formatTwilightTime(startDayTwilight.astronomical.dusk)
        : "N/A",
      // Morning sequence to end day
      astronomicalDawn: endDayTwilight
        ? formatTwilightTime(endDayTwilight.astronomical.dawn)
        : "N/A",
      nauticalDawn: endDayTwilight
        ? formatTwilightTime(endDayTwilight.nautical.dawn)
        : "N/A",
      civilDawn: endDayTwilight
        ? formatTwilightTime(endDayTwilight.civil.dawn)
        : "N/A",
    },
    moon: {
      rise: currentMoonRise,
      set: currentMoonSet,
    },
    dayLabels: {
      startDay: startDayName,
      endDay: endDayName,
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
          {groupedByDay.map(({ date, sunMoon }) => {
            const { dayName, dayDate, moonPhaseEmoji } = formatDayHeader(
              date,
              location,
              sunMoon,
            );
            return (
              <div key={date} className="day-header">
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayDate}</div>
                {moonPhaseEmoji && (
                  <div className="moon-phase-container">
                    <div
                      className="moon-phase-indicator"
                      style={{ fontSize: "1.2rem" }}
                      title={
                        sunMoon?.moonPhaseName
                          ? `${sunMoon.moonPhaseName}${
                              sunMoon.moonIlluminatedFraction !== null
                                ? ` (${Math.round(sunMoon.moonIlluminatedFraction)}% illuminated)`
                                : ""
                            }${
                              sunMoon.moonAge !== null
                                ? ` - ${Math.round(sunMoon.moonAge)} days old`
                                : ""
                            }`
                          : "Moon phase"
                      }
                    >
                      {moonPhaseEmoji}
                    </div>
                    {sunMoon?.moonIlluminatedFraction !== null &&
                      sunMoon?.moonIlluminatedFraction !== undefined && (
                        <div className="moon-illumination">
                          {Math.round(sunMoon.moonIlluminatedFraction)}%
                        </div>
                      )}
                  </div>
                )}
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
                          const solarData = getSolarTwilightAndMoonData(
                            day.date,
                            hour.time,
                            location,
                            groupedByDay,
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
                                Observing Cycle (
                                {solarData.dayLabels?.startDay || ""} →{" "}
                                {solarData.dayLabels?.endDay || ""})
                              </div>

                              {/* Sun Rise/Set for current observing cycle */}
                              <div
                                style={{
                                  marginBottom: "2px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                ☀️ Sunrise: {solarData.sun.rise} | Sunset:{" "}
                                {solarData.sun.set}
                              </div>
                              <div
                                style={{
                                  marginBottom: "3px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                ☀️ Next sunrise: {solarData.sun.nextRise}
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
                                {solarData.dayLabels?.startDay || ""} Evening:
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌆 Civil dusk: {solarData.twilight.civilDusk}
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌃 Nautical dusk:{" "}
                                {solarData.twilight.nauticalDusk}
                              </div>
                              <div
                                style={{
                                  marginBottom: "3px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌌 Astronomical dusk:{" "}
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
                                {solarData.dayLabels?.endDay || ""} Morning:
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌌 Astronomical dawn:{" "}
                                {solarData.twilight.astronomicalDawn}
                              </div>
                              <div
                                style={{
                                  marginBottom: "1px",
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌇 Nautical dawn:{" "}
                                {solarData.twilight.nauticalDawn}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  paddingLeft: "4px",
                                }}
                              >
                                🌅 Civil dawn: {solarData.twilight.civilDawn}
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
