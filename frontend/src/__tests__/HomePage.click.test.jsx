import { render, screen, fireEvent } from '@testing-library/react';

// Ensure React global available
import React from 'react';
globalThis.React = React;

// Use the existing mocks (react-leaflet is resolved to our __mocks__ file)
const HomePage = (await import('../components/HomePage')).default;

describe('HomePage map interactions', () => {
  beforeEach(() => {
    // clear any previous navigate capture
    globalThis.__lastNavigate = null;
    globalThis.__reactLeafletHandlers = {};
  });

  it('selecting a point on the map sets selected marker and triggers navigation when Create Report is clicked', async () => {

    render((await import('../components/HomePage')).default(), { wrapper: (await import('react-router-dom')).MemoryRouter });

    // trigger locationfound to set userPosition and wait for user position marker to appear
    if (typeof globalThis.__reactLeafletHandlers.locationfound === 'function') {
      globalThis.__reactLeafletHandlers.locationfound({ latlng: { lat: 45.07, lng: 7.68 } });
    }

    await screen.findByText(/Posizione utente/i);

    // simulate user click to set selectedPoint — wait for state updates
    if (typeof globalThis.__reactLeafletHandlers.click === 'function') {
      globalThis.__reactLeafletHandlers.click({ latlng: { lat: 41.12, lng: 1.23 } });
    }

    // the selectedPoint marker should appear
    await screen.findAllByTestId('marker');

    // the Create Report button is inside the popup; find and click it
    const button = await screen.findByRole('button', { name: /Create Report/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);

    // check navigation recorded (mock writes to globalThis.__lastNavigate)
    expect(globalThis.__lastNavigate).not.toBeNull();
    expect(globalThis.__lastNavigate.to).toBe('/report');
    expect(globalThis.__lastNavigate.options).toEqual({ state: { lat: 41.12, lng: 1.23 } });
  });
});
