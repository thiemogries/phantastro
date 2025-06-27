import React from "react";
import {
  calculateTwilightTimes,
  calculateSunriseSunset,
} from "../utils/solarUtils";

interface TwilightTimelineProps {
  dates: string[]; // Array of dates in YYYY-MM-DD format for the week
  latitude: number;
  longitude: number;
  sunMoonData?: Array<{
    date: string;
    sunrise?: string | null;
    sunset?: string | null;
  }>; // Optional sun data from API
}

interface TwilightSegment {
  startDay: number; // Day index (0-6)
  startHour: number; // Hour within start day (0-24)
  endDay: number; // Day index (0-6)
  endHour: number; // Hour within end day (0-24)
  type: "day" | "civil" | "nautical" | "astronomical" | "night";
  color: string;
  totalHours: number; // Total duration in hours
}

const TwilightTimeline: React.FC<TwilightTimelineProps> = ({
  dates,
  latitude,
  longitude,
  sunMoonData,
}) => {
  const parseTimeToHour = (timeStr: string | null | undefined): number => {
    if (!timeStr || timeStr === "---" || timeStr === "----") return -1;
    if (timeStr === "24:00") return 24;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  };

  const dateToHour = (date: Date | null): number => {
    if (!date) return -1;
    return date.getHours() + date.getMinutes() / 60;
  };

  const createTwilightSegments = (): TwilightSegment[] => {
    try {
      // Validate coordinates
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error("Invalid coordinates");
      }

      const segments: TwilightSegment[] = [];
      const allEvents: Array<{
        dayIndex: number;
        hour: number;
        type: string;
        absoluteTime: number; // Hours from start of week
      }> = [];

      // Calculate twilight times for each day
      for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
        const currentDate = dates[dayIndex];
        const targetDate = new Date(currentDate + "T12:00:00");

        if (isNaN(targetDate.getTime())) {
          continue;
        }

        // Get sun data for this day
        const dayData = sunMoonData?.find((d) => d.date === currentDate);

        // Calculate twilight times
        const twilightData = calculateTwilightTimes(
          latitude,
          longitude,
          targetDate,
          targetDate,
        );
        const sunTimes = calculateSunriseSunset(
          latitude,
          longitude,
          targetDate,
        );

        // Extract times for each twilight type
        const civilData = twilightData.find((t) => t.twilight === "civil");
        const nauticalData = twilightData.find(
          (t) => t.twilight === "nautical",
        );
        const astronomicalData = twilightData.find(
          (t) => t.twilight === "astronomical",
        );

        // Convert to hours
        const sunriseHour = dayData?.sunrise
          ? parseTimeToHour(dayData.sunrise)
          : dateToHour(sunTimes.sunrise);
        const sunsetHour = dayData?.sunset
          ? parseTimeToHour(dayData.sunset)
          : dateToHour(sunTimes.sunset);

        const civilDawn = dateToHour(civilData?.dawn ?? null);
        const civilDusk = dateToHour(civilData?.dusk ?? null);
        const nauticalDawn = dateToHour(nauticalData?.dawn ?? null);
        const nauticalDusk = dateToHour(nauticalData?.dusk ?? null);
        const astronomicalDawn = dateToHour(astronomicalData?.dawn ?? null);
        const astronomicalDusk = dateToHour(astronomicalData?.dusk ?? null);

        // Add events for this day
        const dayEvents = [];
        if (astronomicalDawn !== -1)
          dayEvents.push({ hour: astronomicalDawn, type: "astronomical-dawn" });
        if (nauticalDawn !== -1)
          dayEvents.push({ hour: nauticalDawn, type: "nautical-dawn" });
        if (civilDawn !== -1)
          dayEvents.push({ hour: civilDawn, type: "civil-dawn" });
        if (sunriseHour !== -1)
          dayEvents.push({ hour: sunriseHour, type: "sunrise" });
        if (sunsetHour !== -1)
          dayEvents.push({ hour: sunsetHour, type: "sunset" });
        if (civilDusk !== -1)
          dayEvents.push({ hour: civilDusk, type: "civil-dusk" });
        if (nauticalDusk !== -1)
          dayEvents.push({ hour: nauticalDusk, type: "nautical-dusk" });
        if (astronomicalDusk !== -1)
          dayEvents.push({ hour: astronomicalDusk, type: "astronomical-dusk" });

        // Convert to absolute time and add to all events
        dayEvents.forEach((event) => {
          allEvents.push({
            dayIndex,
            hour: event.hour,
            type: event.type,
            absoluteTime: dayIndex * 24 + event.hour,
          });
        });
      }

      // Sort all events by absolute time
      allEvents.sort((a, b) => a.absoluteTime - b.absoluteTime);

      // Determine initial state (start of first day)
      let currentState = "night";

      // Check if we start in a different state by looking at the first day's configuration
      if (dates.length > 0) {
        const firstDate = new Date(dates[0] + "T12:00:00");
        const firstDaySun = calculateSunriseSunset(
          latitude,
          longitude,
          firstDate,
        );

        const firstDayData = sunMoonData?.find((d) => d.date === dates[0]);
        const firstSunrise = firstDayData?.sunrise
          ? parseTimeToHour(firstDayData.sunrise)
          : dateToHour(firstDaySun.sunrise);
        const firstSunset = firstDayData?.sunset
          ? parseTimeToHour(firstDayData.sunset)
          : dateToHour(firstDaySun.sunset);

        // If sunrise is after sunset, we start in daylight
        if (
          firstSunrise > firstSunset &&
          firstSunrise !== -1 &&
          firstSunset !== -1
        ) {
          currentState = "day";
        }
      }

      let lastAbsoluteTime = 0;

      // Process each event to create continuous segments
      for (const event of allEvents) {
        // Create segment for current state
        if (event.absoluteTime > lastAbsoluteTime) {
          const startDay = Math.floor(lastAbsoluteTime / 24);
          const startHour = lastAbsoluteTime % 24;
          const endDay = Math.floor(event.absoluteTime / 24);
          const endHour = event.absoluteTime % 24;

          segments.push({
            startDay,
            startHour,
            endDay,
            endHour,
            type: currentState as any,
            color: getColorForState(currentState),
            totalHours: event.absoluteTime - lastAbsoluteTime,
          });
        }

        // Update state based on event
        switch (event.type) {
          case "astronomical-dawn":
            currentState = "astronomical";
            break;
          case "nautical-dawn":
            currentState = "nautical";
            break;
          case "civil-dawn":
            currentState = "civil";
            break;
          case "sunrise":
            currentState = "day";
            break;
          case "sunset":
            currentState = "civil";
            break;
          case "civil-dusk":
            currentState = "nautical";
            break;
          case "nautical-dusk":
            currentState = "astronomical";
            break;
          case "astronomical-dusk":
            currentState = "night";
            break;
        }

        lastAbsoluteTime = event.absoluteTime;
      }

      // Add final segment to end of week
      const weekEndTime = dates.length * 24;
      if (lastAbsoluteTime < weekEndTime) {
        const startDay = Math.floor(lastAbsoluteTime / 24);
        const startHour = lastAbsoluteTime % 24;
        const endDay = Math.floor(weekEndTime / 24) - 1;
        const endHour = 24;

        segments.push({
          startDay,
          startHour,
          endDay,
          endHour,
          type: currentState as any,
          color: getColorForState(currentState),
          totalHours: weekEndTime - lastAbsoluteTime,
        });
      }

      return segments;
    } catch (error) {
      console.warn("Error calculating twilight segments:", error);
      // Fallback to simple night segments for each day
      return dates.map((_, dayIndex) => ({
        startDay: dayIndex,
        startHour: 0,
        endDay: dayIndex,
        endHour: 24,
        type: "night" as const,
        color: "#0f172a",
        totalHours: 24,
      }));
    }
  };

  const getColorForState = (state: string): string => {
    switch (state) {
      case "day":
        return "linear-gradient(to right, #fbbf24, #f59e0b)"; // Yellow/gold
      case "civil":
        return "linear-gradient(to right, #fb923c, #f97316)"; // Orange
      case "nautical":
        return "linear-gradient(to right, #3b82f6, #2563eb)"; // Blue
      case "astronomical":
        return "linear-gradient(to right, #1e40af, #1e3a8a)"; // Dark blue
      case "night":
        return "#0f172a"; // Very dark blue/black
      default:
        return "#0f172a";
    }
  };

  const getTooltipText = (segment: TwilightSegment): string => {
    const formatHour = (hour: number): string => {
      const h = Math.floor(hour);
      const m = Math.floor((hour % 1) * 60);
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const typeNames = {
      day: "Daylight",
      civil: "Civil Twilight",
      nautical: "Nautical Twilight",
      astronomical: "Astronomical Twilight",
      night: "Night",
    };

    const typeDescriptions = {
      day: "Sun above horizon - bright daylight",
      civil: "Sun 0° to -6° below horizon - outdoor activities possible",
      nautical: "Sun -6° to -12° below horizon - horizon visible at sea",
      astronomical: "Sun -12° to -18° below horizon - faint stars visible",
      night: "Sun below -18° - darkest conditions for astronomy",
    };

    const startTime = `${formatHour(segment.startHour)}`;
    const endTime = `${formatHour(segment.endHour)}`;
    const durationText =
      segment.totalHours >= 24
        ? `${Math.floor(segment.totalHours / 24)}d ${(segment.totalHours % 24).toFixed(1)}h`
        : `${segment.totalHours.toFixed(1)}h`;

    const dayText =
      segment.startDay === segment.endDay
        ? `Day ${segment.startDay + 1}`
        : `Days ${segment.startDay + 1}-${segment.endDay + 1}`;

    return `${typeNames[segment.type]} (${dayText}): ${startTime} - ${endTime} (${durationText})\n${typeDescriptions[segment.type]}`;
  };

  const segments = createTwilightSegments();

  return (
    <div className="timeline-track">
      {segments.map((segment, index) => {
        // Calculate position and width across the entire week
        const totalWeekHours = dates.length * 24;
        const startPosition =
          ((segment.startDay * 24 + segment.startHour) / totalWeekHours) * 100;
        const endPosition =
          ((segment.endDay * 24 + segment.endHour) / totalWeekHours) * 100;
        const segmentWidth = endPosition - startPosition;
        const minWidth = 0.1; // Minimum width for visibility
        const actualWidth = Math.max(segmentWidth, minWidth);
        const zIndexOffset: Record<TwilightSegment["type"], number> = {
          day: 300,
          civil: 200,
          nautical: 100,
          astronomical: 0,
          night: 0,
        };
        return (
          <div
            key={index}
            className="twilight-segment"
            style={{
              left: `${startPosition}%`,
              width: `${actualWidth}%`,
              background: segment.color,
              border:
                segment.type === "day"
                  ? "1px solid rgba(251, 191, 36, 0.6)"
                  : "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow:
                segment.type === "day"
                  ? "0 1px 2px rgba(251, 191, 36, 0.4)"
                  : "0 1px 2px rgba(0, 0, 0, 0.2)",
              zIndex: index + zIndexOffset[segment.type],
            }}
            title={getTooltipText(segment)}
          />
        );
      })}
    </div>
  );
};

export default TwilightTimeline;
