import React from 'react';
import { render, screen } from '@testing-library/react';
import ConstellationLoader from '../ConstellationLoader';

// Mock the astronomical utils
jest.mock('../../utils/astronomicalUtils', () => ({
  celestialToScreen: jest.fn(() => ({ x: 100, y: 100, visible: true })),
  degreesToRadians: jest.fn((deg: number) => deg * Math.PI / 180)
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock HTMLCanvasElement.getContext
const mockCanvasContext = {
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  globalAlpha: 1,
  fillStyle: '#ffffff',
  strokeStyle: '#ffffff',
  lineWidth: 1
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);

describe('ConstellationLoader Component', () => {
  test('renders without crashing', () => {
    render(<ConstellationLoader />);
  });

  test('creates canvas element', () => {
    const { container } = render(<ConstellationLoader size="medium" />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '180');
    expect(canvas).toHaveAttribute('height', '180');
  });

  test('displays message when provided', () => {
    const message = 'Loading constellation...';
    render(<ConstellationLoader message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('applies size classes correctly', () => {
    const { container: smallContainer } = render(<ConstellationLoader size="small" />);
    expect(smallContainer.firstChild).toHaveClass('constellation-loader', 'small');

    const { container: mediumContainer } = render(<ConstellationLoader size="medium" />);
    expect(mediumContainer.firstChild).toHaveClass('constellation-loader', 'medium');

    const { container: largeContainer } = render(<ConstellationLoader size="large" />);
    expect(largeContainer.firstChild).toHaveClass('constellation-loader', 'large');
  });

  test('applies custom className', () => {
    const customClass = 'custom-loader';
    const { container } = render(<ConstellationLoader className={customClass} />);
    
    expect(container.firstChild).toHaveClass('constellation-loader', customClass);
  });

  test('renders with different sizes', () => {
    const { container: smallContainer } = render(<ConstellationLoader size="small" />);
    const smallCanvas = smallContainer.querySelector('canvas');
    expect(smallCanvas).toHaveAttribute('width', '120');
    expect(smallCanvas).toHaveAttribute('height', '120');

    const { container: largeContainer } = render(<ConstellationLoader size="large" />);
    const largeCanvas = largeContainer.querySelector('canvas');
    expect(largeCanvas).toHaveAttribute('width', '240');
    expect(largeCanvas).toHaveAttribute('height', '240');
  });
});
