import React, { useState, useRef, useEffect } from "react";
import { LocationSearchResult } from "../types/weather";
import { useLocationSearch } from "../hooks/useWeatherData";
import "./LocationSearch.css";

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  placeholder?: string;
  className?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location...",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use TanStack Query mutation for location search
  const locationSearchMutation = useLocationSearch();
  const loading = locationSearchMutation.isPending;

  const performSearch = React.useCallback((searchQuery: string) => {
    locationSearchMutation.mutate(searchQuery, {
      onSuccess: (searchResults) => {
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
      },
      onError: (error) => {
        console.error("Location search failed:", error);
        setResults([]);
        setIsOpen(false);
      }
    });
  }, [locationSearchMutation]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleLocationSelect = (location: LocationSearchResult) => {
    setQuery(location.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    setKeyboardNavigation(false);
    onLocationSelect(location);
  };

  const handleMouseEnter = (index: number) => {
    if (!keyboardNavigation) {
      setSelectedIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (!keyboardNavigation) {
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setKeyboardNavigation(true);
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setKeyboardNavigation(true);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        setKeyboardNavigation(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getLocationIcon = (location: LocationSearchResult): string => {
    if (
      location.name.toLowerCase().includes("mauna kea") ||
      location.name.toLowerCase().includes("atacama") ||
      location.name.toLowerCase().includes("palomar") ||
      location.name.toLowerCase().includes("mount wilson")
    ) {
      return "🔭"; // Observatory
    }
    return "📍"; // Regular location
  };

  const getElevationText = (elevation?: number): string => {
    if (!elevation || elevation <= 0) return "";
    if (elevation < 1000) return `${elevation}m`;
    return `${(elevation / 1000).toFixed(1)}km`;
  };

  return (
    <div className={`location-search ${className || ""}`}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search for location"
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        <div className="search-icon">
          {loading ? <div className="search-spinner">⏳</div> : <span>🔍</span>}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="search-dropdown"
          role="listbox"
          aria-label="Location search results"
        >
          {results.length > 0 ? (
            <ul className="search-results">
              {results.map((location, index) => (
                <li
                  key={`${location.lat}-${location.lon}`}
                  className={`search-result ${index === selectedIndex && keyboardNavigation ? "keyboard-selected" : ""}`}
                  onClick={() => handleLocationSelect(location)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="result-icon">{getLocationIcon(location)}</div>
                  <div className="result-content">
                    <div className="result-name">{location.name}</div>
                    <div className="result-details">
                      <span className="result-country">{location.country}</span>
                      {location.elevation && (
                        <span className="result-elevation">
                          • {getElevationText(location.elevation)}
                        </span>
                      )}
                    </div>
                    <div className="result-coordinates">
                      {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🌍</div>
              <div className="no-results-text">
                No locations found for "{query}"
              </div>
              <div className="no-results-hint">
                Try searching for a city, observatory, or landmark
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default LocationSearch;
