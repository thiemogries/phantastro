import React from 'react';
import { render } from '@testing-library/react';
import StarField from '../StarField';

describe('StarField Component', () => {
  test('renders without crashing', () => {
    render(<StarField width={800} height={600} />);
  });

  test('creates canvas element with correct dimensions', () => {
    const { container } = render(<StarField width={800} height={600} />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%'
    });
  });

  test('renders with animation disabled', () => {
    render(<StarField width={800} height={600} animate={false} />);
    // Should render without errors
  });

  test('renders with constellation lines disabled', () => {
    render(<StarField width={800} height={600} showConstellations={false} />);
    // Should render without errors
  });
});
