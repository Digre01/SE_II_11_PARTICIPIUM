const React = require('react');
// Provide a way for tests to trigger map events. Handlers are stored on globalThis.
globalThis.__reactLeafletHandlers = globalThis.__reactLeafletHandlers || {};

function registerHandlers(handlers) {
  // store handlers for later triggering by tests
  globalThis.__reactLeafletHandlers = { ...(globalThis.__reactLeafletHandlers || {}), ...handlers };
}

function triggerMapEvent(name, event) {
  const h = globalThis.__reactLeafletHandlers && globalThis.__reactLeafletHandlers[name];
  if (typeof h === 'function') h(event);
}

module.exports = {
  MapContainer: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'map-container', ...props }, children),
  TileLayer: (props) => React.createElement('div', { 'data-testid': 'tile-layer' }),
  Marker: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'marker', ...props }, children),
  Popup: ({ children }) => React.createElement('div', { 'data-testid': 'popup' }, children),
  useMapEvents: (handlers) => {
    // register handlers but do not call them here
    registerHandlers(handlers || {});
    return {
      setView: () => {},
      getZoom: () => 13,
      flyTo: () => {},
      locate: () => {}
    };
  },
  // helper for tests to call: globalThis.__triggerMapEvent(name, event)
  __triggerMapEvent: triggerMapEvent
};
