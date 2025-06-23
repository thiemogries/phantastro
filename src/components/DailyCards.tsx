import React from 'react';
import { DailyForecast } from '../types/weather';
import { getMoonPhaseEmoji } from '../utils/weatherUtils';
import './DailyCards.css';

interface DailyCardsProps {
  dailyData: DailyForecast[];
  className?: string;
}

const DailyCards: React.FC<DailyCardsProps> = ({
  dailyData,
  className
}) => {
  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString || timeString === '---') return '---';

    // Handle special cases
    if (timeString === '00:00') return 'All day';
    if (timeString === '24:00') return 'All day';

    return timeString;
  };



  const formatDateRelative = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  if (!dailyData || dailyData.length === 0) {
    return (
      <div className={`daily-cards ${className || ''}`}>
        <div className="no-data-message">
          <div className="no-data-icon">☀️🌙</div>
          <span>Daily sun and moon times not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`daily-cards ${className || ''}`}>
      <h3>☀️🌙 Daily Sun & Moon Times</h3>
      <div className="cards-container">
        {dailyData.map((day, index) => (
          <div key={day.date} className="daily-card">
            <div className="card-header">
              <div className="date-info">
                <div className="date-relative">{formatDateRelative(day.date)}</div>
                <div className="date-full">
                  {new Date(day.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="card-content">
              {/* Sun Times */}
              <div className="sun-section">
                <div className="section-title">
                  <span className="icon">☀️</span>
                  <span>Sun</span>
                </div>
                <div className="times">
                  <div className="time-item">
                    <span className="time-label">Rise</span>
                    <span className="time-value">
                      {formatTime(day.sunMoon?.sunrise)}
                    </span>
                  </div>
                  <div className="time-item">
                    <span className="time-label">Set</span>
                    <span className="time-value">
                      {formatTime(day.sunMoon?.sunset)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moon Times */}
              <div className="moon-section">
                <div className="section-title">
                  <span className="icon">{getMoonPhaseEmoji(day.sunMoon?.moonPhaseName || null)}</span>
                  <span>Moon</span>
                </div>
                <div className="times">
                  <div className="time-item">
                    <span className="time-label">Rise</span>
                    <span className="time-value">
                      {formatTime(day.sunMoon?.moonrise)}
                    </span>
                  </div>
                  <div className="time-item">
                    <span className="time-label">Set</span>
                    <span className="time-value">
                      {formatTime(day.sunMoon?.moonset)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moon Phase Info */}
              {day.sunMoon?.moonPhaseName && (
                <div className="moon-phase-info">
                  <div className="phase-details">
                    <div className="phase-name">
                      {day.sunMoon.moonPhaseName.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                    {day.sunMoon.moonIlluminatedFraction !== null && (
                      <div className="illumination">
                        {Math.round(day.sunMoon.moonIlluminatedFraction)}% illuminated
                      </div>
                    )}
                    {day.sunMoon.moonAge !== null && (
                      <div className="moon-age">
                        {day.sunMoon.moonAge.toFixed(1)} days old
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyCards;
