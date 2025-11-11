// Test for HomePage map rendering
import { render, screen } from '@testing-library/react';

// Ensure React global is available for legacy JSX runtime references
import React from 'react';
globalThis.React = React;

// react-leaflet is aliased to a local mock via vitest.config; import component after ensuring mocks
const HomePage = (await import('../components/HomePage')).default;
import { MemoryRouter } from 'react-router-dom';

describe('HomePage map', () => {
  it('renders the map container', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
