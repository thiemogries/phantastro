import React from "react";
import {
  calculateTwilightTimes,
  calculateSunriseSunset,
} from "../utils/solarUtils";

interface TwilightTimelineProps {
  date: string; // Date in YYYY-MM-DD format
  latitude: number;
  longitude: number;
  sunrise?: string | null; // Optional sunrise time from API
  sunset?: string | null; // Optional sunset time from API
}

interface TwilightSegment {
  start: number; // Hour of day (0-24)
  end: number; // Hour of day (0-24)
  type: "day" | "civil" | "nautical" | "astronomical" | "night";
  color: string;
}

const TwilightTimeline: React.FC<TwilightTimelineProps> = ({
  date,
  latitude,
  longitude,
  sunrise,
  sunset,
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
      const targetDate = new Date(date + "T12:00:00");

      // Validate date
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date");
      }

      // Validate coordinates
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error("Invalid coordinates");
      }

      // Calculate all twilight times
      const twilightData = calculateTwilightTimes(
        latitude,
        longitude,
        targetDate,
        targetDate,
      );
      const sunTimes = calculateSunriseSunset(latitude, longitude, targetDate);

      // Extract times for each twilight type
      const civilData = twilightData.find((t) => t.twilight === "civil");
      const nauticalData = twilightData.find((t) => t.twilight === "nautical");
      const astronomicalData = twilightData.find(
        (t) => t.twilight === "astronomical",
      );

      // Convert to hours
      const sunriseHour = sunrise
        ? parseTimeToHour(sunrise)
        : dateToHour(sunTimes.sunrise);
      const sunsetHour = sunset
        ? parseTimeToHour(sunset)
        : dateToHour(sunTimes.sunset);

      const civilDawn = dateToHour(civilData?.dawn ?? null);
      const civilDusk = dateToHour(civilData?.dusk ?? null);
      const nauticalDawn = dateToHour(nauticalData?.dawn ?? null);
      const nauticalDusk = dateToHour(nauticalData?.dusk ?? null);
      const astronomicalDawn = dateToHour(astronomicalData?.dawn ?? null);
      const astronomicalDusk = dateToHour(astronomicalData?.dusk ?? null);

      const segments: TwilightSegment[] = [];

      // Handle polar conditions
      if (sunriseHour === -1 && sunsetHour === -1) {
        // No sun - could be polar night
        if (civilDawn === -1 && civilDusk === -1) {
          // Complete polar night
          segments.push({
            start: 0,
            end: 24,
            type: "night",
            color: "#0f172a",
          });
          return segments;
        }
      }

      if (
        (sunriseHour === 0 && sunsetHour === 24) ||
        (sunriseHour === -1 && sunsetHour === -1 && civilDawn !== -1)
      ) {
        // Polar day or midnight sun
        segments.push({
          start: 0,
          end: 24,
          type: "day",
          color: "linear-gradient(to right, #fbbf24, #f59e0b)",
        });
        return segments;
      }

      // Create timeline segments for normal conditions
      const events = [];

      if (astronomicalDawn !== -1)
        events.push({ time: astronomicalDawn, type: "astronomical-dawn" });
      if (nauticalDawn !== -1)
        events.push({ time: nauticalDawn, type: "nautical-dawn" });
      if (civilDawn !== -1)
        events.push({ time: civilDawn, type: "civil-dawn" });
      if (sunriseHour !== -1)
        events.push({ time: sunriseHour, type: "sunrise" });
      if (sunsetHour !== -1) events.push({ time: sunsetHour, type: "sunset" });
      if (civilDusk !== -1)
        events.push({ time: civilDusk, type: "civil-dusk" });
      if (nauticalDusk !== -1)
        events.push({ time: nauticalDusk, type: "nautical-dusk" });
      if (astronomicalDusk !== -1)
        events.push({ time: astronomicalDusk, type: "astronomical-dusk" });

      // Sort events by time
      events.sort((a, b) => a.time - b.time);

      // Determine the state at the start of the day (midnight)
      let currentState = "night";
      if (sunriseHour > sunsetHour && sunriseHour !== -1 && sunsetHour !== -1) {
        // Sun crosses midnight - we're in daylight at start of day
        currentState = "day";
      } else if (
        civilDawn > civilDusk &&
        civilDawn !== -1 &&
        civilDusk !== -1
      ) {
        currentState = "civil";
      } else if (
        nauticalDawn > nauticalDusk &&
        nauticalDawn !== -1 &&
        nauticalDusk !== -1
      ) {
        currentState = "nautical";
      } else if (
        astronomicalDawn > astronomicalDusk &&
        astronomicalDawn !== -1 &&
        astronomicalDusk !== -1
      ) {
        currentState = "astronomical";
      }

      let lastTime = 0;

      // Process each event
      for (const event of events) {
        // Add segment for current state
        if (event.time > lastTime) {
          const color = getColorForState(currentState);
          segments.push({
            start: lastTime,
            end: event.time,
            type: currentState as any,
            color,
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

        lastTime = event.time;
      }

      // Add final segment to end of day
      if (lastTime < 24) {
        const color = getColorForState(currentState);
        segments.push({
          start: lastTime,
          end: 24,
          type: currentState as any,
          color,
        });
      }

      return segments;
    } catch (error) {
      console.warn("Error calculating twilight segments:", error);
      // Fallback to a simple day/night representation
      return [
        {
          start: 0,
          end: 12,
          type: "night",
          color: "#0f172a",
        },
        {
          start: 12,
          end: 24,
          type: "day",
          color: "linear-gradient(to right, #fbbf24, #f59e0b)",
        },
      ];
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

    const duration = segment.end - segment.start;
    const durationText =
      duration === 24 ? "All day" : `${duration.toFixed(1)}h`;

    return `${typeNames[segment.type]}: ${formatHour(segment.start)} - ${formatHour(segment.end)} (${durationText})\n${typeDescriptions[segment.type]}`;
  };

  const segments = createTwilightSegments();

  return (
    <div
      className="timeline-track"
      style={{ position: "relative", height: "100%" }}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          className="twilight-segment"
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            left: `${(segment.start / 24) * 100}%`,
            width: `${((segment.end - segment.start) / 24) * 100}%`,
            background: segment.color,
            borderRadius: "2px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border:
              segment.type === "day"
                ? "1px solid rgba(251, 191, 36, 0.6)"
                : "none",
            boxShadow:
              segment.type === "day"
                ? "0 1px 2px rgba(251, 191, 36, 0.4)"
                : "none",
          }}
          title={getTooltipText(segment)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scaleY(1.5)";
            e.currentTarget.style.zIndex = "10";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scaleY(1)";
            e.currentTarget.style.zIndex = "1";
          }}
        />
      ))}
    </div>
  );
};

export default TwilightTimeline;
