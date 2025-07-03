import React, {useCallback, useEffect, useRef} from 'react';
import { 
  celestialToScreen, 
  magnitudeToSize, 
  magnitudeToOpacity, 
  starColorToCSS,
  getCurrentSiderealTime,
  degreesToRadians
} from '../utils/astronomicalUtils';
import starCatalog from "../data/stars_catalog.json";

interface StarFieldProps {
  width: number;
  height: number;
  showConstellations?: boolean;
  animate?: boolean;
  rotation?: number;
}

const StarField: React.FC<StarFieldProps> = ({
  width,
  height,
  showConstellations = true,
  animate = true,
  rotation = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

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

  const drawStarField = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);

    // Use provided rotation or calculate from time if animation is enabled
    const currentRotation = animate ? getCurrentSiderealTime() : rotation;

    // Draw stars
    starCatalog.stars.forEach(star => {
      const screenPos = celestialToScreen(
        star.ra,
        star.dec,
        width,
        height,
        currentRotation, // Pass rotation as separate parameter
        degreesToRadians(45), // Center on 45 degrees north
        0 // Rotation center at top of page
      );

      if (screenPos.visible) {
        const size = magnitudeToSize(star.magnitude, 0.8); // Much smaller base size
        const opacity = magnitudeToOpacity(star.magnitude);
        const color = starColorToCSS(star.color);

        drawStar(ctx, screenPos.x, screenPos.y, size, color, opacity);
      }
    });
  }, [animate, height, rotation, width]);

  const animate_frame = useCallback((): void => {
    if (animate) {
      drawStarField();
      animationRef.current = requestAnimationFrame(animate_frame);
    }
  }, [animationRef, animate, drawStarField]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (animate) {
      animationRef.current = requestAnimationFrame(animate_frame);
    } else {
      drawStarField();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, animate, animate_frame, drawStarField]);

  useEffect(() => {
    drawStarField();
  }, [rotation, showConstellations, width, height, drawStarField]);

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
