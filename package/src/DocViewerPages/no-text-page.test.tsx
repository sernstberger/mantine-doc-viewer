import { render, screen } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../../../test-utils/render-legacy';

describe('pages without text', () => {
  beforeEach(() => getDocument.mockReset());

  it('says a page has no text when its text layer comes back empty', async () => {
    // The mock has text for three pages, so the fourth is like a scanned page
    mockPdf({ numPages: 4 });
    render(<DocViewer src="/files/scan.pdf" pdfWorkerSrc="/worker.mjs" />);

    const scanned = await screen.findByRole('group', { name: 'Page 4 of 4' });
    expect(await within(scanned).findByText('No text on this page')).toBeInTheDocument();
    const page1 = screen.getByRole('group', { name: 'Page 1 of 4' });
    await within(page1).findByText('Quarterly report');
    expect(within(page1).queryByText('No text on this page')).not.toBeInTheDocument();
  });

  it('takes the text from labels', async () => {
    mockPdf({ numPages: 4 });
    render(
      <DocViewer
        src="/files/scan.pdf"
        pdfWorkerSrc="/worker.mjs"
        labels={{ pageHasNoTextLabel: 'Seite ohne Text' }}
      />
    );
    const scanned = await screen.findByRole('group', { name: 'Page 4 of 4' });
    expect(await within(scanned).findByText('Seite ohne Text')).toBeInTheDocument();
  });
});
