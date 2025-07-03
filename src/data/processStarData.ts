/**
 * Star data processing utilities
 * Uses SIMBAD catalog data parsed from stars.txt
 */

import type { Star } from '../utils/astronomicalUtils';
import starCatalog from './stars_catalog.json';

/**
 * Raw star data from SIMBAD catalog
 */
const rawStarData = starCatalog.stars;

/**
 * Convert raw star data to Star objects
 */
function processStarData(rawData: typeof rawStarData): Star[] {
  return rawData.map(star => ({
    id: star.i,
    name: star.n,
    ra: (star.ra_deg * Math.PI) / 180, // Convert degrees to radians
    dec: (star.dec_deg * Math.PI) / 180, // Convert degrees to radians
    magnitude: star.N,
    color: star.K
  }));
}

// Process the data
const stars = processStarData(rawStarData);

console.log(`Loaded ${stars.length} stars from SIMBAD catalog`);

export default stars;
