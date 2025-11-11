import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Ensure React global available
import React from 'react';
globalThis.React = React;

// We'll stub global.fetch in the test and import ReportForm afterwards so
// the component's initial fetch (fetchCategories) uses the stub.

describe('ReportForm submit', () => {
  it('submits the form (happy path) and calls API.createReport', async () => {
    // stub fetch to handle both fetchCategories and createReport
    vi.stubGlobal('fetch', vi.fn((url, opts) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'Road' }] });
      }
      if (url.includes('/api/v1/reports')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    // import the component after stubbing fetch so its useEffect uses the stub
    const ReportForm = (await import('../components/ReportForm')).default;

    const { container } = render(
      <MemoryRouter>
        <ReportForm />
      </MemoryRouter>
    );

    // Wait for categories to load and then set form values
    const categorySelect = await screen.findByLabelText(/Category/i);
  // wait for category options to be populated and select the first option
  const option = await screen.findByRole('option', { name: /Road/i });
  const categorySelectDom = screen.getByLabelText(/Category/i);
  fireEvent.change(categorySelectDom, { target: { value: option.value, name: 'categoryId' } });

    const titleInput = screen.getByLabelText(/Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { name: 'title', value: 'Test title' } });
    fireEvent.change(descInput, { target: { name: 'description', value: 'Test description' } });

    // upload a file (fire change with files)
    const upload = screen.getByTestId('upload');
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    fireEvent.change(upload, { target: { files: [file] } });

    // submit
  const submitButton = screen.getByRole('button', { name: /submit/i });
  // ensure button is enabled
  await waitFor(() => expect(submitButton).not.toBeDisabled());
  // submit the form via form submit event to ensure handler runs
  const form = container.querySelector('form');
  fireEvent.submit(form);

    // assert API.createReport (the mocked function) was called
    // assert global fetch was called for the report POST
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/reports'), expect.any(Object));
    });
    // cleanup stub
    vi.unstubAllGlobals();
  });
});
