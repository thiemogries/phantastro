#!/usr/bin/env node
/**
 * Script to parse stars.txt (SIMBAD catalog) and convert to JSON format for the star field.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse coordinates from format like '00 53 04.1964421920 +61 07 26.299289856'
 */
function parseCoordinates(coordStr) {
    // Split into RA and Dec parts
    const parts = coordStr.trim().split(/\s+/);
    
    // Parse RA (hours, minutes, seconds)
    const raH = parseFloat(parts[0]);
    const raM = parseFloat(parts[1]);
    const raS = parseFloat(parts[2]);
    
    // Parse Dec (degrees, minutes, seconds)
    const decSign = parts[3][0] === '+' ? 1 : -1;
    const decD = parseFloat(parts[3].substring(1)); // Remove sign
    const decM = parseFloat(parts[4]);
    const decS = parseFloat(parts[5]);
    
    // Convert to decimal degrees
    const raDeg = (raH + raM/60 + raS/3600) * 15; // Convert hours to degrees
    const decDeg = decSign * (decD + decM/60 + decS/3600);
    
    return [raDeg, decDeg];
}

/**
 * Determine star color based on spectral type and B-V color index
 */
function getStarColor(spectralType, bMag, vMag) {
    // Calculate B-V color index if both magnitudes are available
    let bV = null;
    if (bMag !== '~' && vMag !== '~' && bMag && vMag) {
        try {
            bV = parseFloat(bMag) - parseFloat(vMag);
        } catch (e) {
            bV = null;
        }
    }
    
    // Default color (white)
    let color = { r: 1, g: 0.95, b: 0.9 };
    
    if (spectralType) {
        const specType = spectralType.toUpperCase();
        
        // O and B stars (blue-white to blue)
        if (specType.startsWith('O') || specType.startsWith('B')) {
            if (bV !== null && bV < -0.2) {
                color = { r: 0.7, g: 0.8, b: 1 }; // Very blue
            } else if (bV !== null && bV < 0.0) {
                color = { r: 0.8, g: 0.8, b: 1 }; // Blue-white
            } else {
                color = { r: 0.9, g: 0.9, b: 1 }; // Blue-white
            }
        }
        // A stars (white)
        else if (specType.startsWith('A')) {
            color = { r: 1, g: 0.95, b: 0.9 };
        }
        // F stars (yellow-white)
        else if (specType.startsWith('F')) {
            color = { r: 1, g: 0.9, b: 0.7 };
        }
        // G stars (yellow, like our Sun)
        else if (specType.startsWith('G')) {
            color = { r: 1, g: 0.8, b: 0.5 };
        }
        // K stars (orange)
        else if (specType.startsWith('K')) {
            color = { r: 1, g: 0.7, b: 0.4 };
        }
        // M stars (red)
        else if (specType.startsWith('M')) {
            if (bV !== null && bV > 1.5) {
                color = { r: 1, g: 0.5, b: 0.2 }; // Very red
            } else {
                color = { r: 1, g: 0.6, b: 0.3 }; // Red
            }
        }
        // Wolf-Rayet stars (blue)
        else if (specType.includes('WR') || specType.includes('WC') || specType.includes('WN')) {
            color = { r: 0.7, g: 0.8, b: 1 };
        }
    }
    
    // Fine-tune based on B-V color index if available
    if (bV !== null) {
        if (bV < -0.3) { // Very blue
            color = { r: 0.6, g: 0.7, b: 1 };
        } else if (bV < -0.1) { // Blue
            color = { r: 0.8, g: 0.8, b: 1 };
        } else if (bV < 0.2) { // Blue-white
            color = { r: 0.9, g: 0.9, b: 1 };
        } else if (bV < 0.5) { // White
            color = { r: 1, g: 0.95, b: 0.9 };
        } else if (bV < 0.8) { // Yellow-white
            color = { r: 1, g: 0.9, b: 0.7 };
        } else if (bV < 1.2) { // Yellow
            color = { r: 1, g: 0.8, b: 0.5 };
        } else if (bV < 1.6) { // Orange
            color = { r: 1, g: 0.7, b: 0.4 };
        } else { // Red
            color = { r: 1, g: 0.6, b: 0.3 };
        }
    }
    
    return color;
}

/**
 * Parse the stars.txt file and return list of star objects
 */
function parseStarsFile(filename) {
    const stars = [];
    
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    
    // Skip header lines until we find the data
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and headers
        if (!trimmedLine || 
            trimmedLine.startsWith('C.D.S.') || 
            trimmedLine.startsWith('Vmag') || 
            trimmedLine.startsWith('Number') || 
            trimmedLine.startsWith('#') || 
            trimmedLine.startsWith('----')) {
            continue;
        }
        
        // Check if this is a data line (starts with a number)
        if (!/^\d+/.test(trimmedLine)) {
            continue;
        }
        
        // Parse the line using split on pipe character
        const parts = trimmedLine.split('|');
        
        if (parts.length < 8) {
            continue;
        }
        
        try {
            // Extract data
            const starId = parts[0].trim();
            const identifier = parts[1].trim();
            const starType = parts[2].trim();
            const coordinates = parts[3].trim();
            const magU = parts[4].trim();
            const magB = parts[5].trim();
            const magV = parts[6].trim();
            const magR = parts[7].trim();
            const magI = parts.length > 8 ? parts[8].trim() : '~';
            const spectralType = parts.length > 9 ? parts[9].trim() : '';
            
            // Skip if no V magnitude
            if (magV === '~' || !magV) {
                continue;
            }
            
            // Parse coordinates
            const [raDeg, decDeg] = parseCoordinates(coordinates);
            
            // Get V magnitude
            const vMagnitude = parseFloat(magV);
            
            // Skip very faint stars (magnitude > 6.5)
            if (vMagnitude > 6.5) {
                continue;
            }
            
            // Skip southern hemisphere stars (declination < -10°)
            if (decDeg < -10) {
                continue;
            }
            
            // Get star color
            const color = getStarColor(spectralType, magB, magV);
            
            // Create star object
            const star = {
                id: parseInt(starId),
                name: identifier.replace(/\*/g, '').replace('HD', 'HD ').trim(),
                ra: Math.round((raDeg * Math.PI / 180) * 1000000) / 1000000,
                dec: Math.round((decDeg * Math.PI / 180) * 1000000) / 1000000,
                magnitude: Math.round(vMagnitude * 100) / 100,
                color: color
            };
            
            stars.push(star);
            
        } catch (e) {
            console.error(`Error parsing line: ${trimmedLine.substring(0, 50)}... - ${e.message}`);
            continue;
        }
    }
    
    return stars;
}

/**
 * Main function to parse stars and create JSON file
 */
function main() {
    console.log('Parsing stars.txt file...');
    
    const starsFilePath = path.join(__dirname, 'stars.txt');
    const stars = parseStarsFile(starsFilePath);
    
    console.log(`Parsed ${stars.length} stars`);
    
    // Sort by magnitude (brightest first)
    stars.sort((a, b) => a.magnitude - b.magnitude);
    
    // Create the output structure
    const output = {
        description: "Star catalog parsed from SIMBAD data",
        total_stars: stars.length,
        magnitude_range: {
            min: Math.min(...stars.map(star => star.magnitude)),
            max: Math.max(...stars.map(star => star.magnitude))
        },
        stars: stars
    };
    
    // Write to JSON file
    const outputPath = path.join(__dirname, 'stars_catalog.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    
    console.log(`Created stars_catalog.json with ${stars.length} stars`);
    console.log(`Magnitude range: ${output.magnitude_range.min} to ${output.magnitude_range.max}`);
    
    // Print some statistics
    const magnitudeCounts = {};
    for (const star of stars) {
        const magRange = Math.floor(star.magnitude);
        magnitudeCounts[magRange] = (magnitudeCounts[magRange] || 0) + 1;
    }
    
    console.log('\nMagnitude distribution:');
    for (const mag of Object.keys(magnitudeCounts).sort((a, b) => parseInt(a) - parseInt(b))) {
        console.log(`  Magnitude ${mag}: ${magnitudeCounts[mag]} stars`);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    parseCoordinates,
    getStarColor,
    parseStarsFile,
    main
};
