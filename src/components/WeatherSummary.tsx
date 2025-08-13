import React from 'react';
import { Tooltip } from 'react-tooltip';
import { HourlyForecast } from '../types/weather';

interface WeatherSummaryProps {
  hourlyForecast: HourlyForecast[];
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ hourlyForecast }) => {
  // Calculate best hours for astronomical observation
  // Conditions: <5% clouds, 0% rain, ≥15km visibility, <5 m/s wind
  const clearHoursData = hourlyForecast.filter(
    (hour: HourlyForecast) =>
      hour.cloudCover.totalCloudCover !== null &&
      hour.windSpeed !== null &&
      hour.visibility !== null &&
      hour.visibility !== undefined &&
      hour.precipitation.precipitation !== null &&
      hour.cloudCover.totalCloudCover < 5 &&
      hour.precipitation.precipitation === 0 &&
      hour.visibility >= 15 &&
      hour.windSpeed < 5
  );

  const bestHours = clearHoursData.length;

  // Calculate average cloud coverage
  const cloudsWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.cloudCover.totalCloudCover !== null
  );
  const avgClouds =
    cloudsWithData.length > 0
      ? Math.round(
          cloudsWithData.reduce(
            (sum: number, hour: HourlyForecast) =>
              sum + (hour.cloudCover.totalCloudCover || 0),
            0
          ) / cloudsWithData.length
        )
      : null;

  // Calculate average rain chance
  const rainWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.precipitation.precipitationProbability !== null
  );
  const avgRainChance =
    rainWithData.length > 0
      ? Math.round(
          rainWithData.reduce(
            (sum: number, hour: HourlyForecast) =>
              sum + (hour.precipitation.precipitationProbability || 0),
            0
          ) / rainWithData.length
        )
      : null;

  // Calculate average wind speed
  const windWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.windSpeed !== null
  );
  const avgWindSpeed =
    windWithData.length > 0
      ? (
          windWithData.reduce(
            (sum: number, hour: HourlyForecast) => sum + (hour.windSpeed || 0),
            0
          ) / windWithData.length
        ).toFixed(1)
      : null;

  // Calculate average visibility
  const visibilityWithData = hourlyForecast.filter(
    (h: HourlyForecast) => h.visibility !== null
  );
  const avgVisibility =
    visibilityWithData.length > 0
      ? (
          visibilityWithData.reduce(
            (sum: number, hour: HourlyForecast) => sum + (hour.visibility || 0),
            0
          ) / visibilityWithData.length
        ).toFixed(1)
      : null;

  // Helper function to format time from ISO string
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (error) {
      return timeStr;
    }
  };

  // Helper function to format date from ISO string
  const formatDate = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return timeStr;
    }
  };

  // Generate tooltip content for clear hours
  const generateClearHoursTooltip = () => {
    if (clearHoursData.length === 0) {
      return 'No clear hours found in the forecast period.';
    }

    // Group clear hours by date
    const groupedByDate: { [date: string]: HourlyForecast[] } = {};
    clearHoursData.forEach(hour => {
      const date = formatDate(hour.time);
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(hour);
    });

    // Format the tooltip content
    let content =
      'Clear Hours (< 5% clouds, 0% rain, ≥ 15km visibility, < 5 m/s wind):\n\n';

    Object.entries(groupedByDate).forEach(([date, hours]) => {
      content += `${date}:\n`;
      hours.forEach(hour => {
        content += `  ${formatTime(hour.time)}\n`;
      });
      content += '\n';
    });

    return content.trim();
  };

  return (
    <div className="overview-summary">
      <div className="summary-item">
        <span className="summary-label">Good Hours:</span>
        <span
          className="summary-value"
          data-tooltip-id="clear-hours-tooltip"
          style={{ cursor: 'pointer' }}
        >
          {bestHours} clear hour{bestHours === 1 ? '' : 's'}
        </span>
        <Tooltip
          id="clear-hours-tooltip"
          place="bottom"
          offset={10}
          delayShow={200}
          delayHide={100}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            fontSize: '0.75rem',
            maxWidth: '300px',
            zIndex: 1000,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            whiteSpace: 'pre-line',
          }}
        >
          {generateClearHoursTooltip()}
        </Tooltip>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Clouds:</span>
        <span className="summary-value">
          {avgClouds !== null ? `${avgClouds}%` : 'N/A'}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Rain Chance:</span>
        <span className="summary-value">
          {avgRainChance !== null ? `${avgRainChance}%` : 'N/A'}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Wind Speed:</span>
        <span className="summary-value">
          {avgWindSpeed !== null ? `${avgWindSpeed} m/s` : 'N/A'}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Avg Visibility:</span>
        <span className="summary-value">
          {avgVisibility !== null ? `${avgVisibility}km` : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default WeatherSummary;
