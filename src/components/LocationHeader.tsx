import React from "react";
import { Icon } from "@iconify/react";
import { Location } from "../types/weather";

interface LocationHeaderProps {
  location: Location;
  lastUpdated: string;
  isFetching: boolean;
  onRemove?: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  location,
  lastUpdated,
  isFetching,
  onRemove,
}) => {
  return (
    <div className="overview-header">
      <h3>
        {location.name}
        {location.country ? `, ${location.country}` : ""}
      </h3>
      <div className="header-controls">
        <div className="location-details">
          <p className="coordinates">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
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
            aria-label={`Remove ${location.name}`}
            title={`Remove ${location.name}`}
          >
            <Icon icon="mdi:close" width="16" height="16" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationHeader;
