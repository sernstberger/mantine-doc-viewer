import { render, screen } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';

function renderViewer() {
  render(
    <>
      <input aria-label="App field" />
      <TestDocViewer src="/files/report.pdf" />
    </>
  );
}

describe('focus across presentations', () => {
  beforeEach(() => getDocument.mockReset());

  it('comes back to Presentation after the exit button ends one', async () => {
    mockPdf();
    renderViewer();
    await userEvent.click(await screen.findByRole('button', { name: 'Presentation' }));
    await userEvent.click(screen.getByRole('button', { name: 'Exit presentation' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Presentation' })).toHaveFocus());
  });

  it('stays on the pages when Escape ends a presentation', async () => {
    mockPdf();
    renderViewer();
    await userEvent.click(await screen.findByRole('button', { name: 'Presentation' }));
    await userEvent.keyboard('{Escape}');

    await screen.findByRole('button', { name: 'Presentation' });
    expect(screen.getByRole('region', { name: 'report.pdf' })).toHaveFocus();
  });
});
