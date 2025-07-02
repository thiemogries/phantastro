import React, { useState, useRef, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import './SettingsMenu.css';

interface SettingsMenuProps {
  onRefresh?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { clearApiKey } = useApiKey();
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

  const handleRefreshClick = () => {
    onRefresh?.();
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
        ⋯
      </button>
      
      {isOpen && (
        <div ref={menuRef} className="settings-dropdown" role="menu">
          {onRefresh && (
            <button
              className="settings-menu-item"
              onClick={handleRefreshClick}
              role="menuitem"
            >
              <span className="menu-icon">🔄</span>
              Refresh Data
            </button>
          )}
          <button
            className="settings-menu-item"
            onClick={handleClearApiKey}
            role="menuitem"
          >
            <span className="menu-icon">🔑</span>
            Change API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
