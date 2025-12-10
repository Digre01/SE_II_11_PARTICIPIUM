// Test ReportForm integration with map-derived coordinates
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Ensure React global is present for any JSX runtime expectations
import React from 'react';
globalThis.React = React;

// Mock design-react-kit before importing the component to avoid resolving its package
vi.mock('design-react-kit', () => {
  const React = require('react');
  const Input = ({ id, label, value, readOnly }) => React.createElement('input', { id, 'aria-label': label, value, readOnly });
  const TextArea = ({ id, label, value }) => React.createElement('textarea', { id, 'aria-label': label, defaultValue: value });
  const Select = ({ id, label, children, value }) => React.createElement('select', { id, 'aria-label': label, value }, children);
  const Upload = (props) => React.createElement('input', { type: 'file', 'data-testid': 'upload', ...props });
  const UploadList = ({ children }) => React.createElement('div', null, children);
  const UploadListItem = ({ fileName }) => React.createElement('div', null, fileName || 'file');
  const Form = ({ children, onSubmit }) => React.createElement('form', { onSubmit }, children);
  const FormGroup = ({ children }) => React.createElement('div', null, children);
  const Button = ({ children, ...props }) => React.createElement('button', props, children);
  const Alert = ({ children }) => React.createElement('div', null, children);
  return { Input, TextArea, Select, Upload, UploadList, UploadListItem, Form, FormGroup, Button, Alert };
});

// Mock API module
vi.mock('../API/API.mjs', async () => ({
  default: {
    fetchCategories: vi.fn().mockResolvedValue([{ id: 1, name: 'Road' }, { id: 2, name: 'Lighting' }]),
    createReport: vi.fn()
  }
}));

// Mock useLocation to provide coordinates via location.state
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ state: { lat: 12.34, lng: 56.78 } })
  };
});

const ReportForm = (await import('../components/ReportForm')).default;

describe('ReportForm map integration', () => {
  it('initializes latitude and longitude from location.state when present', async () => {
    render(
      <MemoryRouter>
        <ReportForm />
      </MemoryRouter>
    );

    const latInput = await screen.findByLabelText(/Latitude/i);
    const lonInput = await screen.findByLabelText(/Longitude/i);

    expect(latInput).toBeInTheDocument();
    expect(lonInput).toBeInTheDocument();
    // value may be string in DOM input
    expect(latInput).toHaveValue('12.34');
    expect(lonInput).toHaveValue('56.78');
  });
});
