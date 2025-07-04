import React from "react";
import { HourlyForecast } from "../types/weather";

interface WeatherSummaryProps {
  hourlyForecast: HourlyForecast[];
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ hourlyForecast }) => {
  // Calculate best hours (clear skies and low wind)
  const bestHours = hourlyForecast.filter(
    (hour: HourlyForecast) =>
      hour.cloudCover.totalCloudCover !== null &&
      hour.windSpeed !== null &&
      hour.cloudCover.totalCloudCover < 30 &&
      hour.windSpeed < 10,
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

  // Calculate clear periods (< 20% cloud cover)
  const clearPeriods = hourlyForecast.filter(
    (hour: HourlyForecast) =>
      hour.cloudCover.totalCloudCover !== null &&
      hour.cloudCover.totalCloudCover < 20,
  ).length;

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
        <span className="summary-label">Best Hours:</span>
        <span className="summary-value">
          {bestHours} clear hours
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Clouds:</span>
        <span className="summary-value">
          {avgClouds !== null ? `${avgClouds}%` : "N/A"}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Clear Periods:</span>
        <span className="summary-value">
          {clearPeriods}h total
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
