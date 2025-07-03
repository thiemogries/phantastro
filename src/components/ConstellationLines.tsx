import React, { useEffect, useRef } from 'react';
import { celestialToScreen, degreesToRadians } from '../utils/astronomicalUtils';
import constellationData from '../data/constellations.json';

interface ConstellationLinesProps {
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  show?: boolean;
}

const ConstellationLines: React.FC<ConstellationLinesProps> = ({ 
  width, 
  height, 
  rotation = 0,
  opacity = 0.4,
  show = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawConstellationLines = () => {
    const canvas = canvasRef.current;
    if (!canvas || !show) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = `rgba(200, 200, 255, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    // Draw constellation lines
    constellationData.features.forEach(constellation => {
      const { geometry } = constellation;
      
      if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach(lineString => {
          ctx.beginPath();
          let firstPoint = true;

          lineString.forEach(coord => {
            // Convert from degrees to radians
            const ra = degreesToRadians(coord[0]);
            const dec = degreesToRadians(coord[1]);

            const screenPos = celestialToScreen(
              ra,
              dec,
              width,
              height,
              rotation, // Use the same rotation as stars
              degreesToRadians(45) // Center on 45 degrees north (same as stars)
            );

            if (screenPos.visible) {
              if (firstPoint) {
                ctx.moveTo(screenPos.x, screenPos.y);
                firstPoint = false;
              } else {
                ctx.lineTo(screenPos.x, screenPos.y);
              }
            }
          });

          ctx.stroke();
        });
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    drawConstellationLines();
  }, [width, height, rotation, opacity, show]);

  if (!show) return null;

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

export default ConstellationLines;
