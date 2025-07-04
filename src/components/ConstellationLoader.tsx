import React, {useCallback, useEffect, useRef, useState} from 'react';
import './ConstellationLoader.css';
import constellationData from '../data/constellations.json';

interface ConstellationLoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

interface Star {
  x: number;
  y: number;
}

interface Constellation {
  name: string;
  stars: Star[];
  lines: number[][];
}

// Helper function to convert RA/Dec to screen coordinates
const convertCoordinate = (ra: number, dec: number) => {
  // Convert RA from degrees to 0-1 range
  // Flip horizontally since sky maps are typically viewed as mirror image
  const x = 1 - (ra / 360);

  // Convert Dec from degrees to 0-1 range (flip Y for screen coordinates)
  const y = 1 - ((dec + 90) / 180);

  return { x, y };
};

// Helper function to center and scale constellation coordinates
const centerConstellation = (stars: Star[], scale: number = 0.6): Star[] => {
  if (stars.length === 0) return stars;

  // Find bounding box
  const minX = Math.min(...stars.map(s => s.x));
  const maxX = Math.max(...stars.map(s => s.x));
  const minY = Math.min(...stars.map(s => s.y));
  const maxY = Math.max(...stars.map(s => s.y));

  // Calculate center and size
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDimension = Math.max(width, height);

  // Scale and center the constellation
  return stars.map(star => ({
    x: 0.5 + ((star.x - centerX) / maxDimension) * scale,
    y: 0.5 + ((star.y - centerY) / maxDimension) * scale
  }));
};

// Parse constellation data from JSON
const parseConstellationData = () => {
  const constellations: Constellation[] = [];

  constellationData.forEach(constellationInfo => {
    // Convert star coordinates to screen coordinates
    const stars = constellationInfo.stars.map(star =>
      convertCoordinate(star.ra, star.dec)
    );

    // Center and scale the constellation
    const centeredStars = centerConstellation(stars);

    constellations.push({
      name: constellationInfo.name === 'Ursa Major' ? 'Big Dipper' : constellationInfo.name,
      stars: centeredStars,
      lines: constellationInfo.lines
    });
  });

  return constellations;
};



// Parse constellation data from JSON file
const CONSTELLATIONS: Constellation[] = parseConstellationData();

// Debug mode - show all constellations at once
const DEBUG_MODE = false;

const ConstellationLoader: React.FC<ConstellationLoaderProps> = ({
  size = 'medium',
  message,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(1);
  const [progress, setProgress] = useState(0);

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 120, starSize: 1.5 },
    medium: { width: 180, height: 180, starSize: 2.0 },
    large: { width: 240, height: 240, starSize: 2.5 }
  };

  const config = sizeConfig[size];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, starSize } = config;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Helper functions inside useCallback to avoid dependency issues
    const lerpLocal = (start: number, end: number, t: number): number => {
      return start + (end - start) * t;
    };

    const easeInOutCubicLocal = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const drawStarLocal = (x: number, y: number, opacity: number = 1) => {
      if (opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, starSize, 0, 2 * Math.PI);
      ctx.fill();

      // Add glow effect
      ctx.globalAlpha = opacity * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, starSize * 1.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    };

    const drawLineLocal = (x1: number, y1: number, x2: number, y2: number, opacity: number = 1) => {
      if (opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = opacity * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    if (DEBUG_MODE) {
      // Debug mode: show all constellations in a 2x2 grid
      const gridSize = 2;
      const cellWidth = width / gridSize;
      const cellHeight = height / gridSize;

      CONSTELLATIONS.forEach((constellation, index) => {
        const gridX = index % gridSize;
        const gridY = Math.floor(index / gridSize);
        const offsetX = gridX * cellWidth;
        const offsetY = gridY * cellHeight;

        // Draw constellation name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(constellation.name, offsetX + 5, offsetY + 15);

        // Draw stars
        constellation.stars.forEach(star => {
          const x = offsetX + star.x * cellWidth;
          const y = offsetY + star.y * cellHeight;
          drawStarLocal(x, y, 1);
        });

        // Draw lines
        constellation.lines.forEach(line => {
          const star1 = constellation.stars[line[0]];
          const star2 = constellation.stars[line[1]];
          if (star1 && star2) {
            const x1 = offsetX + star1.x * cellWidth;
            const y1 = offsetY + star1.y * cellHeight;
            const x2 = offsetX + star2.x * cellWidth;
            const y2 = offsetY + star2.y * cellHeight;
            drawLineLocal(x1, y1, x2, y2, 1);
          }
        });
      });

      return;
    }

    const fromConstellation = CONSTELLATIONS[fromIndex];
    const toConstellation = CONSTELLATIONS[toIndex];

    // Use progress directly for smooth transition throughout entire cycle
    const easedProgress = easeInOutCubicLocal(progress);



    // Get max number of stars to handle different constellation sizes
    const maxStars = Math.max(fromConstellation.stars.length, toConstellation.stars.length);

    // Draw stars - always morphing from one constellation to the next
    for (let i = 0; i < maxStars; i++) {
      const fromStar = fromConstellation.stars[i];
      const toStar = toConstellation.stars[i];

      if (fromStar && toStar) {
        // Star exists in both - morph position
        const x = lerpLocal(fromStar.x * width, toStar.x * width, easedProgress);
        const y = lerpLocal(fromStar.y * height, toStar.y * height, easedProgress);
        drawStarLocal(x, y, 1);
      } else if (fromStar && !toStar) {
        // Star disappearing
        const opacity = 1 - easedProgress;
        drawStarLocal(fromStar.x * width, fromStar.y * height, opacity);
      } else if (!fromStar && toStar) {
        // Star appearing
        drawStarLocal(toStar.x * width, toStar.y * height, easedProgress);
      }
    }

    // Draw lines - fade between constellation patterns
    const fromOpacity = 1 - easedProgress;
    const toOpacity = easedProgress;

    // Draw from constellation lines (fading out)
    if (fromOpacity > 0) {
      fromConstellation.lines.forEach(line => {
        const star1 = fromConstellation.stars[line[0]];
        const star2 = fromConstellation.stars[line[1]];
        if (star1 && star2) {
          // Calculate current positions of these stars (they might be morphing)
          const toStar1 = toConstellation.stars[line[0]];
          const toStar2 = toConstellation.stars[line[1]];

          const x1 = toStar1 ? lerpLocal(star1.x * width, toStar1.x * width, easedProgress) : star1.x * width;
          const y1 = toStar1 ? lerpLocal(star1.y * height, toStar1.y * height, easedProgress) : star1.y * height;
          const x2 = toStar2 ? lerpLocal(star2.x * width, toStar2.x * width, easedProgress) : star2.x * width;
          const y2 = toStar2 ? lerpLocal(star2.y * height, toStar2.y * height, easedProgress) : star2.y * height;

          drawLineLocal(x1, y1, x2, y2, fromOpacity);
        }
      });
    }

    // Draw to constellation lines (fading in)
    if (toOpacity > 0) {
      toConstellation.lines.forEach(line => {
        const star1 = toConstellation.stars[line[0]];
        const star2 = toConstellation.stars[line[1]];
        if (star1 && star2) {
          // Calculate current positions of these stars (they might be morphing)
          const fromStar1 = fromConstellation.stars[line[0]];
          const fromStar2 = fromConstellation.stars[line[1]];

          const x1 = fromStar1 ? lerpLocal(fromStar1.x * width, star1.x * width, easedProgress) : star1.x * width;
          const y1 = fromStar1 ? lerpLocal(fromStar1.y * height, star1.y * height, easedProgress) : star1.y * height;
          const x2 = fromStar2 ? lerpLocal(fromStar2.x * width, star2.x * width, easedProgress) : star2.x * width;
          const y2 = fromStar2 ? lerpLocal(fromStar2.y * height, star2.y * height, easedProgress) : star2.y * height;

          drawLineLocal(x1, y1, x2, y2, toOpacity);
        }
      });
    }
  }, [config, fromIndex, toIndex, progress]);

  // Animation loop with from/to approach
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 0.008; // Slower increment for smoother animation
        if (newProgress >= 1) {
          // Complete transition: move to next constellation pair
          setFromIndex(toIndex);
          setToIndex((toIndex + 1) % CONSTELLATIONS.length);
          return 0; // Reset progress for next cycle
        }
        return newProgress;
      });
    }, 50); // 50ms intervals for smooth animation

    return () => clearInterval(interval);
  }, [toIndex]);

  // Draw effect
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className={`constellation-loader ${size} ${className || ''}`}>
      <div className="constellation-container">
        <canvas
          ref={canvasRef}
          width={config.width}
          height={config.height}
          style={{
            width: config.width,
            height: config.height,
            display: 'block'
          }}
        />
      </div>
      {message && <div className="constellation-message">{message}</div>}
    </div>
  );
};

export default ConstellationLoader;
