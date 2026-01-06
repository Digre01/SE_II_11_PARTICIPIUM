const React = require('react');

globalThis.__reactLeafletHandlers = globalThis.__reactLeafletHandlers || {};

function registerHandlers(handlers) {

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

    registerHandlers(handlers || {});
    return {
      setView: () => {},
      getZoom: () => 13,
      flyTo: () => {},
      locate: () => {}
    };
  },
  __triggerMapEvent: triggerMapEvent
};
