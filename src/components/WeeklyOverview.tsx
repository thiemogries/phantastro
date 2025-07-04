import React from 'react';
import { HourlyForecast } from '../types/weather';
import { useWeatherData, WeatherQueryParams } from '../hooks/useWeatherData';

import TwilightTimeline from './TwilightTimeline';
import MoonTimeline from './MoonTimeline';
import ConstellationLoader from './ConstellationLoader';
import ErrorMessage from './ErrorMessage';
import WeatherSummary from './WeatherSummary';
import HourGrid from './HourGrid';
import HourTooltips from './HourTooltips';
import LocationHeader from './LocationHeader';
import DayHeaders from './DayHeaders';

import './WeeklyOverview.css';

interface WeeklyOverviewProps {
  location: WeatherQueryParams; // Location parameters for data fetching
  className?: string;
  onRemove?: () => void; // Optional remove callback
}

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
    hourlyData.slice(0, 168).forEach(hour => {
      // 7 days * 24 hours = 168
      const date = hour.time.split('T')[0];
      if (!days[date]) days[date] = [];
      days[date].push(hour);
    });

    const result = Object.entries(days)
      .slice(0, 7)
      .map(([date, hours]) => ({
        date,
        hours: hours.slice(0, 24), // Ensure max 24 hours per day
        sunMoon: dailyData?.find(day => day.date === date)?.sunMoon,
      }));

    // Pad with empty days if we have fewer than 7 days
    while (result.length < 7) {
      const lastDate = result[result.length - 1]?.date;
      const nextDate = lastDate
        ? new Date(new Date(lastDate).getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        : new Date().toISOString().split('T')[0];

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
      <div className={`weekly-overview ${className || ''}`}>
        <LocationHeader
          location={{ ...location, name: location.name || 'Unknown Location' }}
          lastUpdated="Loading weather data..."
          isFetching={false}
          onRemove={onRemove}
        />
        <div className="loading-container">
          <ConstellationLoader size="medium" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (queryError && !forecast) {
    return (
      <div className={`weekly-overview ${className || ''}`}>
        <LocationHeader
          location={{ ...location, name: location.name || 'Unknown Location' }}
          lastUpdated="Error loading data"
          isFetching={false}
          onRemove={onRemove}
        />
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
      <div className={`weekly-overview ${className || ''}`}>
        <LocationHeader
          location={location}
          lastUpdated="No data available"
          isFetching={false}
          onRemove={onRemove}
        />
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
      <div className={`weekly-overview ${className || ''}`}>
        <div className="no-data-compact">
          <span className="no-data-icon">📊</span>
          <span>7-day hourly overview not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`weekly-overview ${className || ''}`}>
      <LocationHeader
        location={forecast.location}
        lastUpdated={lastUpdated}
        isFetching={isFetching}
        onRemove={onRemove}
      />

      <div className="weekly-grid">
        {/* Header row with day names */}
        <DayHeaders groupedByDay={groupedByDay} location={forecast.location} />

        {/* Column-based grid structure for CSS-only hover effects */}
        <HourGrid groupedByDay={groupedByDay} />

        {/* Tooltips for all hour columns - rendered in portal to break out of container */}
        <HourTooltips
          groupedByDay={groupedByDay}
          location={forecast.location}
        />

        {/* Twilight timeline row */}
        <div className="grid-row sun-row">
          <div className="continuous-timeline">
            <TwilightTimeline
              dates={groupedByDay.map(day => day.date)}
              latitude={location.lat}
              longitude={location.lon}
              sunMoonData={groupedByDay.map(day => ({
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
              dates={groupedByDay.map(day => day.date)}
              sunMoonData={groupedByDay.map(day => ({
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
