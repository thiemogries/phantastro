import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  celestialToScreen,
  magnitudeToSize,
  magnitudeToOpacity,
  starColorToCSS,
  getCurrentSiderealTime,
  getTimeBasedRotation,
  degreesToRadians
} from '../utils/astronomicalUtils';
import starCatalog from "../data/stars_catalog.json";

interface StarFieldProps {
  width?: number;
  height?: number;
  showConstellations?: boolean;
  animate?: boolean;
  rotation?: number;
  useTimeBasedRotation?: boolean;
}

// Move drawStar function outside component to prevent recreation on every render
const drawStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) => {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();

  // Add a subtle glow effect for brighter stars
  if (size > 1.5) {
    ctx.globalAlpha = opacity * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
};

// Pre-calculate star properties that don't change
interface ProcessedStar {
  ra: number;
  dec: number;
  size: number;
  opacity: number;
  color: string;
}

const processedStars: ProcessedStar[] = starCatalog.stars.map(star => ({
  ra: star.ra,
  dec: star.dec,
  size: magnitudeToSize(star.magnitude, 0.8),
  opacity: magnitudeToOpacity(star.magnitude),
  color: starColorToCSS(star.color)
}));

const StarField: React.FC<StarFieldProps> = ({
  width: propWidth,
  height: propHeight,
  animate = true,
  rotation = 0,
  useTimeBasedRotation = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRotationRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Internal window size state - used when width/height props are not provided
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Use provided dimensions or fall back to window size
  const width = propWidth ?? windowSize.width;
  const height = propHeight ?? windowSize.height;

  const propsRef = useRef({ width, height, animate, rotation, useTimeBasedRotation });

  // Update props ref when props change
  propsRef.current = { width, height, animate, rotation, useTimeBasedRotation };

  // Optimized drawing function that uses refs to avoid dependency changes
  const drawStarField = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      width: currentWidth,
      height: currentHeight,
      animate: currentAnimate,
      rotation: currentRotation,
      useTimeBasedRotation: currentUseTimeBasedRotation
    } = propsRef.current;

    // Clear canvas completely
    ctx.clearRect(0, 0, currentWidth, currentHeight);

    // Determine rotation value based on mode
    let rotationValue: number;
    if (currentAnimate) {
      // Use sidereal time for smooth animation
      rotationValue = getCurrentSiderealTime();
    } else if (currentUseTimeBasedRotation) {
      // Use time-based rotation for static but time-updated display
      rotationValue = getTimeBasedRotation();
    } else {
      // Use provided rotation value
      rotationValue = currentRotation;
    }

    // Draw stars using pre-processed data
    processedStars.forEach(star => {
      const screenPos = celestialToScreen(
        star.ra,
        star.dec,
        currentWidth,
        currentHeight,
        rotationValue, // Pass rotation as separate parameter
        degreesToRadians(45), // Center on 45 degrees north
        0 // Rotation center at top of page
      );

      if (screenPos.visible) {
        drawStar(ctx, screenPos.x, screenPos.y, star.size, star.color, star.opacity);
      }
    });
  }, []); // No dependencies - uses refs instead

  // Optimized animation function with stable reference
  const animate_frame = useCallback(function animateFrame(): void {
    if (propsRef.current.animate) {
      drawStarField();
      animationRef.current = requestAnimationFrame(animateFrame);
    }
  }, [drawStarField]);

  // Effect for window resize when using internal window size
  useEffect(() => {
    // Only set up resize listener if we're not using provided width/height props
    if (propWidth !== undefined && propHeight !== undefined) {
      return; // Use provided dimensions, no need for resize listener
    }

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propWidth, propHeight]);

  // Effect for canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  // Effect for animation control
  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    if (animate) {
      animationRef.current = requestAnimationFrame(animate_frame);
    } else {
      drawStarField();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [animate, animate_frame, drawStarField]);

  // Effect for time-based rotation when not animating
  useEffect(() => {
    // Clear any existing time rotation interval
    if (timeRotationRef.current) {
      clearInterval(timeRotationRef.current);
      timeRotationRef.current = undefined;
    }

    if (!animate && useTimeBasedRotation) {
      // Update rotation based on current time - same frequency as before (50ms)
      timeRotationRef.current = setInterval(() => {
        drawStarField();
      }, 50);
    }

    return () => {
      if (timeRotationRef.current) {
        clearInterval(timeRotationRef.current);
        timeRotationRef.current = undefined;
      }
    };
  }, [animate, useTimeBasedRotation, drawStarField]);

  // Effect for rotation changes when not animating and not using time-based rotation
  useEffect(() => {
    if (!animate && !useTimeBasedRotation) {
      drawStarField();
    }
  }, [rotation, animate, useTimeBasedRotation, drawStarField]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1
      }}
    />
  );
};

export default StarField;
