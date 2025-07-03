#!/usr/bin/env python3
"""
Script to parse stars.txt (SIMBAD catalog) and convert to JSON format for the star field.
"""

import re
import json
import math

def parse_coordinates(coord_str):
    """Parse coordinates from format like '00 53 04.1964421920 +61 07 26.299289856'"""
    # Split into RA and Dec parts
    parts = coord_str.strip().split()
    
    # Parse RA (hours, minutes, seconds)
    ra_h = float(parts[0])
    ra_m = float(parts[1])
    ra_s = float(parts[2])
    
    # Parse Dec (degrees, minutes, seconds)
    dec_sign = 1 if parts[3][0] == '+' else -1
    dec_d = float(parts[3][1:])  # Remove sign
    dec_m = float(parts[4])
    dec_s = float(parts[5])
    
    # Convert to decimal degrees
    ra_deg = (ra_h + ra_m/60 + ra_s/3600) * 15  # Convert hours to degrees
    dec_deg = dec_sign * (dec_d + dec_m/60 + dec_s/3600)
    
    return ra_deg, dec_deg

def get_star_color(spectral_type, b_mag, v_mag):
    """Determine star color based on spectral type and B-V color index"""
    
    # Calculate B-V color index if both magnitudes are available
    b_v = None
    if b_mag != '~' and v_mag != '~' and b_mag and v_mag:
        try:
            b_v = float(b_mag) - float(v_mag)
        except:
            b_v = None
    
    # Default color (white)
    color = {"r": 1, "g": 0.95, "b": 0.9}
    
    if spectral_type:
        spec_type = spectral_type.upper()
        
        # O and B stars (blue-white to blue)
        if spec_type.startswith('O') or spec_type.startswith('B'):
            if b_v is not None and b_v < -0.2:
                color = {"r": 0.7, "g": 0.8, "b": 1}  # Very blue
            elif b_v is not None and b_v < 0.0:
                color = {"r": 0.8, "g": 0.8, "b": 1}  # Blue-white
            else:
                color = {"r": 0.9, "g": 0.9, "b": 1}  # Blue-white
        
        # A stars (white)
        elif spec_type.startswith('A'):
            color = {"r": 1, "g": 0.95, "b": 0.9}
        
        # F stars (yellow-white)
        elif spec_type.startswith('F'):
            color = {"r": 1, "g": 0.9, "b": 0.7}
        
        # G stars (yellow, like our Sun)
        elif spec_type.startswith('G'):
            color = {"r": 1, "g": 0.8, "b": 0.5}
        
        # K stars (orange)
        elif spec_type.startswith('K'):
            color = {"r": 1, "g": 0.7, "b": 0.4}
        
        # M stars (red)
        elif spec_type.startswith('M'):
            if b_v is not None and b_v > 1.5:
                color = {"r": 1, "g": 0.5, "b": 0.2}  # Very red
            else:
                color = {"r": 1, "g": 0.6, "b": 0.3}  # Red
        
        # Wolf-Rayet stars (blue)
        elif 'WR' in spec_type or 'WC' in spec_type or 'WN' in spec_type:
            color = {"r": 0.7, "g": 0.8, "b": 1}
    
    # Fine-tune based on B-V color index if available
    if b_v is not None:
        if b_v < -0.3:  # Very blue
            color = {"r": 0.6, "g": 0.7, "b": 1}
        elif b_v < -0.1:  # Blue
            color = {"r": 0.8, "g": 0.8, "b": 1}
        elif b_v < 0.2:  # Blue-white
            color = {"r": 0.9, "g": 0.9, "b": 1}
        elif b_v < 0.5:  # White
            color = {"r": 1, "g": 0.95, "b": 0.9}
        elif b_v < 0.8:  # Yellow-white
            color = {"r": 1, "g": 0.9, "b": 0.7}
        elif b_v < 1.2:  # Yellow
            color = {"r": 1, "g": 0.8, "b": 0.5}
        elif b_v < 1.6:  # Orange
            color = {"r": 1, "g": 0.7, "b": 0.4}
        else:  # Red
            color = {"r": 1, "g": 0.6, "b": 0.3}
    
    return color

def parse_stars_file(filename):
    """Parse the stars.txt file and return list of star objects"""
    stars = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Skip header lines until we find the data
    data_started = False
    for line in lines:
        line = line.strip()
        
        # Skip empty lines and headers
        if not line or line.startswith('C.D.S.') or line.startswith('Vmag') or line.startswith('Number') or line.startswith('#') or line.startswith('----'):
            continue
        
        # Check if this is a data line (starts with a number)
        if not re.match(r'^\d+', line):
            continue
        
        # Parse the line using regex to handle the fixed-width format
        # Format: number | identifier | type | coordinates | magnitudes | spectral type | refs
        parts = line.split('|')
        
        if len(parts) < 8:
            continue
        
        try:
            # Extract data
            star_id = parts[0].strip()
            identifier = parts[1].strip()
            star_type = parts[2].strip()
            coordinates = parts[3].strip()
            mag_u = parts[4].strip()
            mag_b = parts[5].strip()
            mag_v = parts[6].strip()
            mag_r = parts[7].strip()
            mag_i = parts[8].strip() if len(parts) > 8 else '~'
            spectral_type = parts[9].strip() if len(parts) > 9 else ''
            
            # Skip if no V magnitude
            if mag_v == '~' or not mag_v:
                continue
            
            # Parse coordinates
            ra_deg, dec_deg = parse_coordinates(coordinates)
            
            # Get V magnitude
            v_magnitude = float(mag_v)
            
            # Skip very faint stars (magnitude > 6.5)
            if v_magnitude > 6.5:
                continue
            
            # Skip southern hemisphere stars (declination < -10°)
            if dec_deg < -10:
                continue
            
            # Get star color
            color = get_star_color(spectral_type, mag_b, mag_v)
            
            # Create star object
            star = {
                "i": int(star_id),
                "n": identifier.replace('*', '').replace('HD', 'HD ').strip(),
                "ra_deg": round(ra_deg, 6),
                "dec_deg": round(dec_deg, 6),
                "N": round(v_magnitude, 2),
                "K": color
            }
            
            stars.append(star)
            
        except Exception as e:
            print(f"Error parsing line: {line[:50]}... - {e}")
            continue
    
    return stars

def main():
    """Main function to parse stars and create JSON file"""
    print("Parsing stars.txt file...")
    
    stars = parse_stars_file('stars.txt')
    
    print(f"Parsed {len(stars)} stars")
    
    # Sort by magnitude (brightest first)
    stars.sort(key=lambda x: x['N'])
    
    # Create the output structure
    output = {
        "description": "Star catalog parsed from SIMBAD data",
        "total_stars": len(stars),
        "magnitude_range": {
            "min": min(star['N'] for star in stars),
            "max": max(star['N'] for star in stars)
        },
        "stars": stars
    }
    
    # Write to JSON file
    with open('stars_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Created stars_catalog.json with {len(stars)} stars")
    print(f"Magnitude range: {output['magnitude_range']['min']} to {output['magnitude_range']['max']}")
    
    # Print some statistics
    magnitude_counts = {}
    for star in stars:
        mag_range = int(star['N'])
        magnitude_counts[mag_range] = magnitude_counts.get(mag_range, 0) + 1
    
    print("\nMagnitude distribution:")
    for mag in sorted(magnitude_counts.keys()):
        print(f"  Magnitude {mag}: {magnitude_counts[mag]} stars")

if __name__ == "__main__":
    main()
