import React from "react";
import { HourlyForecast } from "../types/weather";
import { getCloudCoverageInfo, getRainState } from "../utils/weatherUtils";

interface DayData {
  date: string;
  hours: HourlyForecast[];
  sunMoon?: any;
}

interface HourGridProps {
  groupedByDay: DayData[];
}

const HourGrid: React.FC<HourGridProps> = ({ groupedByDay }) => {
  // Helper function to get visibility color
  const getVisibilityColor = (vis: number): string => {
    if (vis >= 20) return "#22c55e";
    else if (vis >= 10) return "#f59e0b";
    else return "#ef4444";
  };

  // Helper function to get windspeed color and opacity
  const getWindspeedStyle = (windSpeed: number | null) => {
    if (windSpeed === null || windSpeed === undefined) {
      return {
        backgroundColor: "#6b7280",
        opacity: 0.3,
      };
    }

    // Use petrol color with opacity based on wind speed
    // Higher wind speeds get higher opacity (more visible)
    const opacity = Math.min(1.0, Math.max(0.2, 0.2 + (windSpeed / 10) * 0.8));

    return {
      backgroundColor: "#008080", // Petrol color
      opacity,
    };
  };

  return (
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

                  {/* Windspeed cell */}
                  <div
                    className="hour-cell windspeed-cell"
                    style={
                      hour
                        ? getWindspeedStyle(hour.windSpeed)
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
  );
};

export default HourGrid;
