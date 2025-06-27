import React from "react";

interface SunTimelineProps {
  dates: string[]; // Array of dates in YYYY-MM-DD format for the week
  sunMoonData: Array<{
    date: string;
    sunrise?: string | null;
    sunset?: string | null;
  }>;
}

interface SunSegment {
  startDay: number; // Day index (0-6)
  startHour: number; // Hour within start day (0-24)
  endDay: number; // Day index (0-6)
  endHour: number; // Hour within end day (0-24)
  totalHours: number; // Total duration in hours
  sunrise?: string;
  sunset?: string;
  crossesMidnight: boolean;
}

const SunTimeline: React.FC<SunTimelineProps> = ({ dates, sunMoonData }) => {
  const parseTimeToHour = (timeStr: string | null | undefined): number => {
    if (!timeStr || timeStr === "---" || timeStr === "----") return -1;
    if (timeStr === "24:00") return 24;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  };

  const createSunSegments = (): SunSegment[] => {
    const segments: SunSegment[] = [];

    // Create events array with all sun rise/set events
    const events: Array<{
      dayIndex: number;
      hour: number;
      type: 'rise' | 'set';
      absoluteTime: number;
      timeString: string;
    }> = [];

    // Collect all sun events across the week
    dates.forEach((date, dayIndex) => {
      const dayData = sunMoonData.find(d => d.date === date);
      if (!dayData) return;

      const sunriseHour = parseTimeToHour(dayData.sunrise);
      const sunsetHour = parseTimeToHour(dayData.sunset);

      if (sunriseHour !== -1) {
        events.push({
          dayIndex,
          hour: sunriseHour,
          type: 'rise',
          absoluteTime: dayIndex * 24 + sunriseHour,
          timeString: dayData.sunrise || '',
        });
      }

      if (sunsetHour !== -1) {
        events.push({
          dayIndex,
          hour: sunsetHour,
          type: 'set',
          absoluteTime: dayIndex * 24 + sunsetHour,
          timeString: dayData.sunset || '',
        });
      }
    });

    // Sort events by absolute time
    events.sort((a, b) => a.absoluteTime - b.absoluteTime);

    // Determine initial sun state
    let sunVisible = false;

    // Check if sun is already visible at the start of the week
    // Look for patterns that suggest sun was visible before the week started
    if (events.length > 0) {
      const firstEvent = events[0];
      if (firstEvent.type === 'set') {
        // First event is a sunset, so sun must have been visible
        sunVisible = true;
      }
    }

    // Process events to create continuous segments
    let segmentStart = 0; // Start of current segment in absolute hours
    let currentRise = '';
    let currentSet = '';

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.type === 'rise' && !sunVisible) {
        // Sun rises - start a new visible segment
        segmentStart = event.absoluteTime;
        currentRise = event.timeString;
        sunVisible = true;
      } else if (event.type === 'set' && sunVisible) {
        // Sun sets - end the current visible segment
        const segmentEnd = event.absoluteTime;
        currentSet = event.timeString;

        if (segmentEnd > segmentStart) {
          const startDay = Math.floor(segmentStart / 24);
          const startHour = segmentStart % 24;
          const endDay = Math.floor(segmentEnd / 24);
          const endHour = segmentEnd % 24;

          segments.push({
            startDay,
            startHour,
            endDay,
            endHour,
            totalHours: segmentEnd - segmentStart,
            sunrise: currentRise,
            sunset: currentSet,
            crossesMidnight: startDay !== endDay,
          });
        }

        sunVisible = false;
        currentRise = '';
        currentSet = '';
      }
    }

    // Handle case where sun is still visible at the end of the week
    if (sunVisible && segmentStart < dates.length * 24) {
      const weekEnd = dates.length * 24;
      const startDay = Math.floor(segmentStart / 24);
      const startHour = segmentStart % 24;
      const endDay = dates.length - 1;
      const endHour = 24;

      segments.push({
        startDay,
        startHour,
        endDay,
        endHour,
        totalHours: weekEnd - segmentStart,
        sunrise: currentRise,
        sunset: 'continues',
        crossesMidnight: startDay !== endDay,
      });
    }

    // Handle special cases for days with no rise/set events (polar conditions)
    dates.forEach((date, dayIndex) => {
      const dayData = sunMoonData.find(d => d.date === date);
      if (!dayData) return;

      const sunriseHour = parseTimeToHour(dayData.sunrise);
      const sunsetHour = parseTimeToHour(dayData.sunset);

      // If no rise/set events for this day, check if we should assume all-day visibility (polar day)
      if (sunriseHour === -1 && sunsetHour === -1) {
        // Check if adjacent days have sun events, suggesting continuation
        const prevDay = dayIndex > 0 ? sunMoonData.find(d => d.date === dates[dayIndex - 1]) : null;
        const nextDay = dayIndex < dates.length - 1 ? sunMoonData.find(d => d.date === dates[dayIndex + 1]) : null;

        const prevHasEvents = prevDay && (
          parseTimeToHour(prevDay.sunrise) !== -1 || parseTimeToHour(prevDay.sunset) !== -1
        );
        const nextHasEvents = nextDay && (
          parseTimeToHour(nextDay.sunrise) !== -1 || parseTimeToHour(nextDay.sunset) !== -1
        );

        // For polar day conditions (midnight sun), assume all-day visibility
        // This typically happens in high latitudes during summer
        if ((prevHasEvents || nextHasEvents) &&
            !segments.some(seg => seg.startDay <= dayIndex && seg.endDay >= dayIndex)) {
          segments.push({
            startDay: dayIndex,
            startHour: 0,
            endDay: dayIndex,
            endHour: 24,
            totalHours: 24,
            sunrise: 'midnight sun',
            sunset: 'midnight sun',
            crossesMidnight: false,
          });
        }
      }
    });

    return segments.sort((a, b) => (a.startDay * 24 + a.startHour) - (b.startDay * 24 + b.startHour));
  };

  const getTooltipText = (segment: SunSegment): string => {
    const formatHour = (hour: number): string => {
      const h = Math.floor(hour);
      const m = Math.floor((hour % 1) * 60);
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const startTime = formatHour(segment.startHour);
    const endTime = formatHour(segment.endHour);

    const durationText = segment.totalHours >= 24
      ? `${Math.floor(segment.totalHours / 24)}d ${(segment.totalHours % 24).toFixed(1)}h`
      : `${segment.totalHours.toFixed(1)}h`;

    const dayText = segment.startDay === segment.endDay
      ? `Day ${segment.startDay + 1}`
      : `Days ${segment.startDay + 1}-${segment.endDay + 1}`;

    let riseSetText = '';
    if (segment.sunrise === 'midnight sun' && segment.sunset === 'midnight sun') {
      riseSetText = 'Midnight sun (no rise/set events)';
    } else if (segment.sunset === 'continues') {
      riseSetText = `Sunrise: ${segment.sunrise} - continues beyond week`;
    } else if (segment.sunrise && segment.sunset) {
      riseSetText = `Sunrise: ${segment.sunrise} - Sunset: ${segment.sunset}`;
    }

    return `Sun Visibility (${dayText}): ${startTime} - ${endTime} (${durationText})\n${riseSetText}`;
  };

  const segments = createSunSegments();

  return (
    <div className="timeline-track">
      {segments.map((segment, index) => {
        // Calculate position and width across the entire week
        const totalWeekHours = dates.length * 24;
        const startPosition = ((segment.startDay * 24 + segment.startHour) / totalWeekHours) * 100;
        const endPosition = ((segment.endDay * 24 + segment.endHour) / totalWeekHours) * 100;
        const segmentWidth = endPosition - startPosition;
        const minWidth = 0.1; // Minimum width for visibility
        const actualWidth = Math.max(segmentWidth, minWidth);

        return (
          <div
            key={index}
            className="sun-line"
            style={{
              left: `${startPosition}%`,
              width: `${actualWidth}%`,
              display: "block",
              position: "absolute",
              top: 0,
              height: "100%",
              background: "linear-gradient(to right, #fbbf24, #f59e0b)",
              borderRadius: "2px",
              border: "1px solid rgba(251, 191, 36, 0.6)",
              boxShadow: "0 1px 2px rgba(251, 191, 36, 0.4)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              zIndex: index,
            }}
            title={getTooltipText(segment)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(251, 191, 36, 0.6)";
              e.currentTarget.style.transform = "scaleY(1.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(251, 191, 36, 0.4)";
              e.currentTarget.style.transform = "scaleY(1)";
            }}
          />
        );
      })}
    </div>
  );
};

export default SunTimeline;
