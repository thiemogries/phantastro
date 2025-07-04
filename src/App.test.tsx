import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Phantastro app', () => {
  render(<App />);
  // Check if the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
