import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setups.js',
  exclude: ['e2e/**'],
  include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx,mjs,ts,tsx}'],
  }
  ,
  resolve: {
    alias: {
      // point heavy UI/map libs to lightweight mocks during tests
      'design-react-kit': '/src/__mocks__/design-react-kit.js',
      'react-leaflet': '/src/__mocks__/react-leaflet.js',
      'react-router': '/src/__mocks__/react-router.js'
    }
  }
});

