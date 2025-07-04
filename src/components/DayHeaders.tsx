import React from "react";
import { Icon } from "@iconify/react";
import { Location, HourlyForecast } from "../types/weather";
import { getMoonPhaseIcon } from "../utils/weatherUtils";
import { calculateSunriseSunset } from "../utils/solarUtils";

interface DayData {
  date: string;
  hours: HourlyForecast[];
  sunMoon?: any;
}

interface DayHeadersProps {
  groupedByDay: DayData[];
  location: Location;
}

// Helper function to calculate clear night hours for background opacity
const calculateClearNightHours = (
  dayData: DayData,
  nextDayData: DayData | undefined,
  location: Location
): number => {
  if (!dayData.hours || dayData.hours.length === 0) return 0;

  try {
    // Calculate sunset for current day and sunrise for next day
    const currentDate = new Date(dayData.date + "T12:00:00");
    const nextDate = nextDayData
      ? new Date(nextDayData.date + "T12:00:00")
      : new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    const currentSun = calculateSunriseSunset(location.lat, location.lon, currentDate);
    const nextSun = calculateSunriseSunset(location.lat, location.lon, nextDate);

    if (!currentSun.sunset || !nextSun.sunrise) return 0;

    // Get sunset and sunrise hours (0-23)
    const sunsetHour = currentSun.sunset.getHours();
    const sunriseHour = nextSun.sunrise.getHours();

    // Collect all night hours (from sunset to next sunrise)
    const nightHours: HourlyForecast[] = [];

    // Add hours from current day (from sunset onwards)
    for (let i = sunsetHour; i < 24; i++) {
      const hour = dayData.hours[i];
      if (hour) nightHours.push(hour);
    }

    // Add hours from next day (until sunrise)
    if (nextDayData?.hours) {
      for (let i = 0; i < sunriseHour; i++) {
        const hour = nextDayData.hours[i];
        if (hour) nightHours.push(hour);
      }
    }

    if (nightHours.length === 0) return 0;

    // Count clear hours using same criteria as best hours calculation
    const clearHours = nightHours.filter(
      (hour: HourlyForecast) =>
        hour.cloudCover.totalCloudCover !== null &&
        hour.windSpeed !== null &&
        hour.visibility !== null &&
        hour.visibility !== undefined &&
        hour.precipitation.precipitation !== null &&
        hour.cloudCover.totalCloudCover < 5 &&
        hour.precipitation.precipitation === 0 &&
        hour.visibility >= 15 &&
        hour.windSpeed < 5,
    ).length;

    return clearHours / nightHours.length; // Return ratio (0-1)
  } catch (error) {
    console.warn('Error calculating clear night hours:', error);
    return 0;
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

  // Get moon phase icon if available
  const moonPhaseIcon = sunMoon?.moonPhaseName
    ? getMoonPhaseIcon(
        sunMoon.moonPhaseName,
        sunMoon.moonIlluminatedFraction,
        sunMoon.moonAge
      )
    : "";

  return { dayName, dayDate, moonPhaseIcon };
};

const DayHeaders: React.FC<DayHeadersProps> = ({ groupedByDay, location }) => {
  return (
    <div className="grid-header">
      {groupedByDay.map((dayData, index) => {
        const { date, sunMoon } = dayData;
        const { dayName, dayDate, moonPhaseIcon } = formatDayHeader(
          date,
          location,
          sunMoon,
        );

        // Calculate clear night hours ratio for background opacity
        const nextDayData = groupedByDay[index + 1];
        const clearNightRatio = calculateClearNightHours(dayData, nextDayData, location);

        // Calculate background opacity: minimum 0.01, maximum 0.2
        const backgroundOpacity = 0.01 + (clearNightRatio * (0.2 - 0.01));

        return (
          <div
            key={date}
            className="day-header"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
            }}
          >
            <div className="day-info-container">
              <div className="day-text">
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayDate}</div>
              </div>
              {moonPhaseIcon && (
                <div className="moon-phase-container">
                  <div
                    className="moon-phase-indicator"
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
                    <Icon icon={moonPhaseIcon} width="16" height="16" />
                  </div>
                  {sunMoon?.moonIlluminatedFraction !== null &&
                    sunMoon?.moonIlluminatedFraction !== undefined && (
                      <div className="moon-illumination">
                        {Math.round(sunMoon.moonIlluminatedFraction)}%
                      </div>
                    )}
                </div>
              )}
            </div>
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
  );
};

export default DayHeaders;
