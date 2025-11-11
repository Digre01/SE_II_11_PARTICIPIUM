// Provide a navigate implementation that records last navigation for tests
globalThis.__lastNavigate = globalThis.__lastNavigate || null;

function useNavigate() {
  return function(to, options) {
    globalThis.__lastNavigate = { to, options };
  };
}

module.exports = { useNavigate };
