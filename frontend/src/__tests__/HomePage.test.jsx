// Test for HomePage map rendering
import { render, screen } from '@testing-library/react';

import React from 'react';
globalThis.React = React;

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
