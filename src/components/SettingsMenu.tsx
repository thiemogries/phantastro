import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useShareLocations } from '../hooks/useShareLocations';
import { WeatherQueryParams } from '../hooks/useWeatherData';
import './SettingsMenu.css';

interface SettingsMenuProps {
  locations?: WeatherQueryParams[];
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ locations = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { clearApiKey } = useApiKey();
  const { shareLocations } = useShareLocations();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setIsOpen(false);
  };

  const handleShareLocations = async () => {
    await shareLocations(locations);
    setIsOpen(false);
  };

  return (
    <div className="settings-menu">
      <button
        ref={buttonRef}
        className="settings-button"
        onClick={handleToggleMenu}
        aria-label="Settings menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon icon="mdi:dots-vertical" width="20" height="20" />
      </button>

      {isOpen && (
        <div ref={menuRef} className="settings-dropdown" role="menu">
          {locations.length > 0 && (
            <button
              className="settings-menu-item share-locations-button"
              onClick={handleShareLocations}
              role="menuitem"
            >
              <span className="menu-icon">
                <Icon icon="mdi:share-variant" width="16" height="16" />
              </span>
              Share Locations
            </button>
          )}
          <button
            className="settings-menu-item clear-api-key-button"
            onClick={handleClearApiKey}
            role="menuitem"
          >
            <span className="menu-icon">
              <Icon icon="mdi:broom" width="16" height="16" />
            </span>
            Clear API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
