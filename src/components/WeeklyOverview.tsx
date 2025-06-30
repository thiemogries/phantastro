import React from "react";
import { HourlyForecast, Location } from "../types/weather";
import { useWeatherData, WeatherQueryParams } from "../hooks/useWeatherData";
import {
  getMoonPhaseEmoji,
} from "../utils/weatherUtils";

import TwilightTimeline from "./TwilightTimeline";
import MoonTimeline from "./MoonTimeline";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import WeatherSummary from "./WeatherSummary";
import HourGrid from "./HourGrid";
import HourTooltips from "./HourTooltips";

import "./WeeklyOverview.css";

interface WeeklyOverviewProps {
  location: WeatherQueryParams; // Location parameters for data fetching
  className?: string;
  onRemove?: () => void; // Optional remove callback
}

// Helper functions

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






const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  location,
  className,
  onRemove,
}) => {
  // Fetch weather data for this location
  const {
    data: forecast,
    isLoading,
    error: queryError,
    isFetching,
  } = useWeatherData(location);

  // Group hourly data by day - always call this hook
  const groupedByDay = React.useMemo(() => {
    if (!forecast?.hourlyForecast || forecast.hourlyForecast.length === 0) {
      return [];
    }

    const hourlyData = forecast.hourlyForecast;
    const dailyData = forecast.dailyForecast;

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
  }, [forecast?.hourlyForecast, forecast?.dailyForecast]);

  // Handle loading state
  if (isLoading && !forecast) {
    return (
      <div className={`weekly-overview ${className || ""}`}>
        <div className="overview-header">
          <h3>{location.locationName}</h3>
        </div>
        <div className="loading-container">
          <LoadingSpinner size="medium" />
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (queryError && !forecast) {
    return (
      <div className={`weekly-overview ${className || ""}`}>
        <div className="overview-header">
          <h3>{location.locationName}</h3>
        </div>
        <ErrorMessage
          message={(queryError as Error).message}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Handle no data state
  if (!forecast) {
    return (
      <div className={`weekly-overview ${className || ""}`}>
        <div className="overview-header">
          <h3>{location.locationName}</h3>
        </div>
        <div className="no-data-message">
          <div className="no-data-icon">📡</div>
          <div className="no-data-text">
            <h4>No weather data available</h4>
            <p>Unable to load weather data for this location.</p>
          </div>
        </div>
      </div>
    );
  }

  const { lastUpdated } = forecast;

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
        <h3>
          {forecast.location.name}
          {forecast.location.country ? `, ${forecast.location.country}` : ""}
        </h3>
        <div className="header-controls">
          <div className="location-details">
            <p className="coordinates">
              {forecast.location.lat.toFixed(4)}°, {forecast.location.lon.toFixed(4)}°
            </p>
            <p className="last-updated">
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleTimeString([], {
                hour12: false,
              })}
              {isFetching && <span className="updating-indicator"> • Updating...</span>}
            </p>
          </div>
          {onRemove && (
            <button
              className="remove-location-button"
              onClick={onRemove}
              aria-label={`Remove ${forecast.location.name}`}
              title={`Remove ${forecast.location.name}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="weekly-grid">
        {/* Header row with day names */}
        <div className="grid-header">
          {groupedByDay.map(({ date, sunMoon }) => {
            const { dayName, dayDate, moonPhaseEmoji } = formatDayHeader(
              date,
              forecast.location,
              sunMoon,
            );
            return (
              <div key={date} className="day-header">
                <div className="day-info-container">
                  <div className="day-text">
                    <div className="day-name">{dayName}</div>
                    <div className="day-date">{dayDate}</div>
                  </div>
                  {moonPhaseEmoji && (
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
                </div>
                {forecast.location?.timezone && (
                  <div
                    className="timezone-indicator"
                    style={{ fontSize: "0.6rem", opacity: 0.7 }}
                  >
                    {forecast.location.timezone}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Column-based grid structure for CSS-only hover effects */}
        <HourGrid groupedByDay={groupedByDay} />

        {/* Tooltips for all hour columns - rendered in portal to break out of container */}
        <HourTooltips groupedByDay={groupedByDay} location={forecast.location} />

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
      <WeatherSummary hourlyForecast={forecast.hourlyForecast} />
    </div>
  );
};

export default WeeklyOverview;
