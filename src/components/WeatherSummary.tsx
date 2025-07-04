import React from "react";
import { HourlyForecast } from "../types/weather";

interface WeatherSummaryProps {
  hourlyForecast: HourlyForecast[];
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ hourlyForecast }) => {
  // Calculate best hours for astronomical observation
  // Conditions: <5% clouds, 0% rain, ≥15km visibility, <5 m/s wind
  const bestHours = hourlyForecast.filter(
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

  // Calculate average cloud coverage
  const cloudsWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.cloudCover.totalCloudCover !== null
  );
  const avgClouds = cloudsWithData.length > 0
    ? Math.round(
        cloudsWithData.reduce(
          (sum: number, hour: HourlyForecast) => sum + (hour.cloudCover.totalCloudCover || 0),
          0
        ) / cloudsWithData.length
      )
    : null;

  // Calculate average rain chance
  const rainWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.precipitation.precipitationProbability !== null
  );
  const avgRainChance = rainWithData.length > 0
    ? Math.round(
        rainWithData.reduce(
          (sum: number, hour: HourlyForecast) => sum + (hour.precipitation.precipitationProbability || 0),
          0
        ) / rainWithData.length
      )
    : null;

  // Calculate average visibility
  const visibilityWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.visibility !== null
  );
  const avgVisibility = visibilityWithData.length > 0
    ? (
        visibilityWithData.reduce(
          (sum: number, hour: HourlyForecast) => sum + (hour.visibility || 0),
          0
        ) / visibilityWithData.length
      ).toFixed(1)
    : null;



  return (
    <div className="overview-summary">
      <div className="summary-item">
        <span className="summary-label">Good Hours:</span>
        <span className="summary-value">
          {bestHours} clear hour{bestHours === 1 ? "" : "s"}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Clouds:</span>
        <span className="summary-value">
          {avgClouds !== null ? `${avgClouds}%` : "N/A"}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Rain Chance:</span>
        <span className="summary-value">
          {avgRainChance !== null ? `${avgRainChance}%` : "N/A"}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Visibility:</span>
        <span className="summary-value">
          {avgVisibility !== null ? `${avgVisibility}km` : "N/A"}
        </span>
      </div>
    </div>
  );
};

export default WeatherSummary;
