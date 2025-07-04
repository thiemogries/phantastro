import { addIcon } from '@iconify/react';

// Import specific icons from bundled packages
import dotsVertical from '@iconify-icons/mdi/dots-vertical';
import broom from '@iconify-icons/mdi/broom';
import search from '@iconify-icons/mdi/search';
import close from '@iconify-icons/mdi/close';
import mapMarker from '@iconify-icons/mdi/map-marker';
import weatherCloudy from '@iconify-icons/mdi/weather-cloudy';
import weatherPartlyCloudy from '@iconify-icons/mdi/weather-partly-cloudy';
import weatherRainy from '@iconify-icons/mdi/weather-rainy';
import weatherSnowy from '@iconify-icons/mdi/weather-snowy';
import weatherLightningRainy from '@iconify-icons/mdi/weather-lightning-rainy';
import weatherPartlyRainy from '@iconify-icons/mdi/weather-partly-rainy';
import star from '@iconify-icons/mdi/star';
import starOutline from '@iconify-icons/mdi/star-outline';
import sparkles from '@iconify-icons/mdi/sparkles';
import starShooting from '@iconify-icons/mdi/star-shooting';
import closeCircle from '@iconify-icons/mdi/close-circle';
import alert from '@iconify-icons/mdi/alert';
import information from '@iconify-icons/mdi/information';
import refresh from '@iconify-icons/mdi/refresh';
import helpCircleOutline from '@iconify-icons/mdi/help-circle-outline';

// Import Weather Icons
import moonNew from '@iconify-icons/wi/moon-new';
import moonAltNew from '@iconify-icons/wi/moon-alt-new';
import moonWaxingCrescent1 from '@iconify-icons/wi/moon-waxing-crescent-1';
import moonWaxingCrescent2 from '@iconify-icons/wi/moon-waxing-crescent-2';
import moonWaxingCrescent3 from '@iconify-icons/wi/moon-waxing-crescent-3';
import moonWaxingCrescent4 from '@iconify-icons/wi/moon-waxing-crescent-4';
import moonWaxingCrescent5 from '@iconify-icons/wi/moon-waxing-crescent-5';
import moonWaxingCrescent6 from '@iconify-icons/wi/moon-waxing-crescent-6';
import moonFirstQuarter from '@iconify-icons/wi/moon-first-quarter';
import moonWaxingGibbous1 from '@iconify-icons/wi/moon-waxing-gibbous-1';
import moonWaxingGibbous2 from '@iconify-icons/wi/moon-waxing-gibbous-2';
import moonWaxingGibbous3 from '@iconify-icons/wi/moon-waxing-gibbous-3';
import moonWaxingGibbous4 from '@iconify-icons/wi/moon-waxing-gibbous-4';
import moonWaxingGibbous5 from '@iconify-icons/wi/moon-waxing-gibbous-5';
import moonWaxingGibbous6 from '@iconify-icons/wi/moon-waxing-gibbous-6';
import moonFull from '@iconify-icons/wi/moon-full';
import moonWaningGibbous1 from '@iconify-icons/wi/moon-waning-gibbous-1';
import moonWaningGibbous2 from '@iconify-icons/wi/moon-waning-gibbous-2';
import moonWaningGibbous3 from '@iconify-icons/wi/moon-waning-gibbous-3';
import moonWaningGibbous4 from '@iconify-icons/wi/moon-waning-gibbous-4';
import moonWaningGibbous5 from '@iconify-icons/wi/moon-waning-gibbous-5';
import moonWaningGibbous6 from '@iconify-icons/wi/moon-waning-gibbous-6';
import moonThirdQuarter from '@iconify-icons/wi/moon-third-quarter';
import moonWaningCrescent1 from '@iconify-icons/wi/moon-waning-crescent-1';
import moonWaningCrescent2 from '@iconify-icons/wi/moon-waning-crescent-2';
import moonWaningCrescent3 from '@iconify-icons/wi/moon-waning-crescent-3';
import moonWaningCrescent4 from '@iconify-icons/wi/moon-waning-crescent-4';
import moonWaningCrescent5 from '@iconify-icons/wi/moon-waning-crescent-5';
import moonWaningCrescent6 from '@iconify-icons/wi/moon-waning-crescent-6';

/**
 * Preload all commonly used icons by adding them to the Iconify cache
 * This ensures icons are available immediately without network requests
 */
export const preloadIcons = () => {
  // Add MDI icons
  addIcon('mdi:dots-vertical', dotsVertical);
  addIcon('mdi:broom', broom);
  addIcon('mdi:search', search);
  addIcon('mdi:close', close);
  addIcon('mdi:map-marker', mapMarker);
  addIcon('mdi:weather-cloudy', weatherCloudy);
  addIcon('mdi:weather-partly-cloudy', weatherPartlyCloudy);
  addIcon('mdi:weather-rainy', weatherRainy);
  addIcon('mdi:weather-snowy', weatherSnowy);
  addIcon('mdi:weather-lightning-rainy', weatherLightningRainy);
  addIcon('mdi:weather-partly-rainy', weatherPartlyRainy);
  addIcon('mdi:star', star);
  addIcon('mdi:star-outline', starOutline);
  addIcon('mdi:sparkles', sparkles);
  addIcon('mdi:star-shooting', starShooting);
  addIcon('mdi:close-circle', closeCircle);
  addIcon('mdi:alert', alert);
  addIcon('mdi:information', information);
  addIcon('mdi:refresh', refresh);
  addIcon('mdi:help-circle-outline', helpCircleOutline);

  // Add Weather Icons
  addIcon('wi:moon-new', moonNew);
  addIcon('wi:moon-alt-new', moonAltNew);
  addIcon('wi:moon-waxing-crescent-1', moonWaxingCrescent1);
  addIcon('wi:moon-waxing-crescent-2', moonWaxingCrescent2);
  addIcon('wi:moon-waxing-crescent-3', moonWaxingCrescent3);
  addIcon('wi:moon-waxing-crescent-4', moonWaxingCrescent4);
  addIcon('wi:moon-waxing-crescent-5', moonWaxingCrescent5);
  addIcon('wi:moon-waxing-crescent-6', moonWaxingCrescent6);
  addIcon('wi:moon-first-quarter', moonFirstQuarter);
  addIcon('wi:moon-waxing-gibbous-1', moonWaxingGibbous1);
  addIcon('wi:moon-waxing-gibbous-2', moonWaxingGibbous2);
  addIcon('wi:moon-waxing-gibbous-3', moonWaxingGibbous3);
  addIcon('wi:moon-waxing-gibbous-4', moonWaxingGibbous4);
  addIcon('wi:moon-waxing-gibbous-5', moonWaxingGibbous5);
  addIcon('wi:moon-waxing-gibbous-6', moonWaxingGibbous6);
  addIcon('wi:moon-full', moonFull);
  addIcon('wi:moon-waning-gibbous-1', moonWaningGibbous1);
  addIcon('wi:moon-waning-gibbous-2', moonWaningGibbous2);
  addIcon('wi:moon-waning-gibbous-3', moonWaningGibbous3);
  addIcon('wi:moon-waning-gibbous-4', moonWaningGibbous4);
  addIcon('wi:moon-waning-gibbous-5', moonWaningGibbous5);
  addIcon('wi:moon-waning-gibbous-6', moonWaningGibbous6);
  addIcon('wi:moon-third-quarter', moonThirdQuarter);
  addIcon('wi:moon-waning-crescent-1', moonWaningCrescent1);
  addIcon('wi:moon-waning-crescent-2', moonWaningCrescent2);
  addIcon('wi:moon-waning-crescent-3', moonWaningCrescent3);
  addIcon('wi:moon-waning-crescent-4', moonWaningCrescent4);
  addIcon('wi:moon-waning-crescent-5', moonWaningCrescent5);
  addIcon('wi:moon-waning-crescent-6', moonWaningCrescent6);
};
