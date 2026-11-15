import { render, screen } from '@mantine-tests/core';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { DocViewer } from '../../../../test-utils/render-legacy';

const renderPdf = (props: Partial<React.ComponentProps<typeof DocViewer>> = {}) =>
  render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" {...props} />);

describe('screen reader details', () => {
  beforeEach(() => getDocument.mockReset());

  it('names the info sections with ids of their own in each viewer', async () => {
    mockPdf();
    render(
      <>
        <DocViewer src="/files/a.pdf" pdfWorkerSrc="/worker.mjs" />
        <DocViewer src="/files/b.pdf" pdfWorkerSrc="/worker.mjs" />
      </>
    );
    const buttons = await screen.findAllByRole('button', { name: 'Document info' });
    const ids: (string | null)[] = [];
    for (const button of buttons) {
      // Opening one popover closes the other
      await userEvent.click(button);
      const section = await screen.findByRole('region', { name: 'Properties' });
      ids.push(section.getAttribute('aria-labelledby'));
    }
    expect(new Set(ids).size).toBe(2);
  });

  it('reads the page indicator as a sentence', async () => {
    mockPdf();
    renderPdf();
    const toolbar = await screen.findByRole('toolbar', { name: 'Document toolbar' });
    expect(await within(toolbar).findByText('Page 1 of 3')).toBeInTheDocument();
    expect(within(toolbar).getByText('1 / 3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('says a presentation started and that Escape ends it', async () => {
    mockPdf();
    renderPdf();
    await userEvent.click(await screen.findByRole('button', { name: 'Presentation' }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Presentation started, press Escape to exit'
      )
    );
    expect(screen.getByRole('button', { name: 'Exit presentation' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Escape'
    );
  });
});
