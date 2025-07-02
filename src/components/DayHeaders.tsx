import React from "react";
import { Icon } from "@iconify/react";
import { Location } from "../types/weather";
import { getMoonPhaseIcon } from "../utils/weatherUtils";

interface DayData {
  date: string;
  hours: any[];
  sunMoon?: any;
}

interface DayHeadersProps {
  groupedByDay: DayData[];
  location: Location;
}

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
      {groupedByDay.map(({ date, sunMoon }) => {
        const { dayName, dayDate, moonPhaseIcon } = formatDayHeader(
          date,
          location,
          sunMoon,
        );
        return (
          <div key={date} className="day-header">
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
