import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { HourlyForecast, Location } from "../types/weather";
import {
  calculateTwilightForDate,
  calculateSunriseSunset,
} from "../utils/solarUtils";

interface DayData {
  date: string;
  hours: HourlyForecast[];
  sunMoon?: any;
}

interface HourTooltipsProps {
  groupedByDay: DayData[];
  location: Location;
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

  // Determine observing cycle based on current hour
  // If it's before noon, we're in the previous night's cycle
  // If it's after noon, we're in the current night's cycle
  const currentHourOfDay = currentHour.getHours();
  const isBeforeNoon = currentHourOfDay < 12;

  let cycleStartDay, cycleEndDay;
  let startDayName, endDayName;

  if (isBeforeNoon) {
    // We're in the previous night's observing cycle
    cycleStartDay = prevDayData || currentDayData;
    cycleEndDay = currentDayData;
    startDayName = cycleStartDay
      ? new Date(cycleStartDay.date + "T12:00:00").toLocaleDateString([], {
          weekday: "short",
        })
      : "";
    endDayName = cycleEndDay
      ? new Date(cycleEndDay.date + "T12:00:00").toLocaleDateString([], {
          weekday: "short",
        })
      : "";
  } else {
    // We're in the current night's observing cycle
    cycleStartDay = currentDayData;
    cycleEndDay = nextDayData || currentDayData;
    startDayName = cycleStartDay
      ? new Date(cycleStartDay.date + "T12:00:00").toLocaleDateString([], {
          weekday: "short",
        })
      : "";
    endDayName = cycleEndDay
      ? new Date(cycleEndDay.date + "T12:00:00").toLocaleDateString([], {
          weekday: "short",
        })
      : "";
  }

  // Calculate twilight times for the cycle start day (evening twilight)
  let startDayTwilight = null;
  const startDayTargetDate = cycleStartDay
    ? new Date(cycleStartDay.date + "T12:00:00")
    : null;

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

  // Calculate twilight times for the cycle end day (morning twilight)
  let endDayTwilight = null;
  const endDayTargetDate = cycleEndDay
    ? new Date(cycleEndDay.date + "T12:00:00")
    : null;

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

  // Get next sunrise (from the end day of the cycle)
  const nextSunrise = cycleEndDay ? getSunriseTime(cycleEndDay) : "N/A";

  return {
    sun: {
      rise: nextSunrise,
      set: cycleStartSunset,
      nextRise: nextSunrise,
    },
    twilight: {
      civilDusk: startDayTwilight?.civil?.dusk
        ? formatTwilightTime(startDayTwilight.civil.dusk)
        : "N/A",
      nauticalDusk: startDayTwilight?.nautical?.dusk
        ? formatTwilightTime(startDayTwilight.nautical.dusk)
        : "N/A",
      astronomicalDusk: startDayTwilight?.astronomical?.dusk
        ? formatTwilightTime(startDayTwilight.astronomical.dusk)
        : "N/A",
      astronomicalDawn: endDayTwilight?.astronomical?.dawn
        ? formatTwilightTime(endDayTwilight.astronomical.dawn)
        : "N/A",
      nauticalDawn: endDayTwilight?.nautical?.dawn
        ? formatTwilightTime(endDayTwilight.nautical.dawn)
        : "N/A",
      civilDawn: endDayTwilight?.civil?.dawn
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

const HourTooltips: React.FC<HourTooltipsProps> = ({ groupedByDay, location }) => {
  return (
    <>
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
    </>
  );
};

export default HourTooltips;
