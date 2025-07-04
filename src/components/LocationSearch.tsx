import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { LocationSearchResult } from '../types/weather';
import { useLocationSearch } from '../hooks/useWeatherData';
import './LocationSearch.css';

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  placeholder?: string;
  className?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = 'Search for a location...',
  className,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the query to reduce API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 600); // 600ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Use TanStack Query for location search with automatic caching and cancellation
  const {
    data: results = [],
    isLoading: loading,
    error,
  } = useLocationSearch(debouncedQuery);

  // Update dropdown visibility when results change
  useEffect(() => {
    if (debouncedQuery.trim().length >= 3) {
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [results, debouncedQuery]);

  // Handle search errors
  useEffect(() => {
    if (error) {
      console.error('Location search failed:', error);
      setIsOpen(false);
    }
  }, [error]);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    // Only show dropdown if there's a meaningful query and results
    if (debouncedQuery.trim().length >= 3 && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleLocationSelect = (location: LocationSearchResult) => {
    setQuery(''); // Clear the form input
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
      case 'ArrowDown':
        e.preventDefault();
        setKeyboardNavigation(true);
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setKeyboardNavigation(true);
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        setKeyboardNavigation(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getElevationText = (elevation?: number): string => {
    if (!elevation || elevation <= 0) return '';
    if (elevation < 1000) return `${elevation}m`;
    return `${(elevation / 1000).toFixed(1)}km`;
  };

  return (
    <div className={`location-search ${className || ''}`}>
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
          {loading ? (
            <div className="search-spinner">
              <Icon
                icon="mdi:loading"
                className="spinning"
                width="16"
                height="16"
              />
            </div>
          ) : (
            <Icon icon="mdi:magnify" width="16" height="16" />
          )}
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
            <>
              <ul className="search-results">
                {results.map((location, index) => (
                  <li
                    key={`${location.lat}-${location.lon}`}
                    className={`search-result ${index === selectedIndex && keyboardNavigation ? 'keyboard-selected' : ''}`}
                    onClick={() => handleLocationSelect(location)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <div className="result-content">
                      <div className="result-name">{location.name}</div>
                      <div className="result-details">
                        <div className="result-left">
                          <span className="result-country">
                            {location.country}
                          </span>
                          {location.elevation && (
                            <span className="result-elevation">
                              • {getElevationText(location.elevation)}
                            </span>
                          )}
                        </div>
                        <span className="result-coordinates">
                          {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="search-attribution">
                Search powered by{' '}
                <a
                  href="https://nominatim.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attribution-link"
                >
                  OpenStreetMap Nominatim
                </a>
              </div>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <Icon icon="mdi:earth" width="32" height="32" />
              </div>
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
