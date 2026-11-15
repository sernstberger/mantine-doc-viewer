import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../../../test-utils/render-legacy';

const PDF = { src: '/files/report.pdf', pdfWorkerSrc: '/worker.mjs' } as const;

describe('Styles API selectors of the document info, page editor and markup bars', () => {
  beforeEach(() => getDocument.mockReset());

  it('applies classNames to the document info headings and layer checkboxes', async () => {
    mockPdf({ layers: [{ id: 'l1', name: 'Notes layer', visible: true }] });
    render(
      <DocViewer
        {...PDF}
        classNames={{ documentHeading: 'app-heading', documentLayer: 'app-layer' }}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Document info' }));
    expect(document.querySelectorAll('.app-heading').length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector('.app-layer')).toContainElement(
      screen.getByRole('checkbox', { name: 'Notes layer' })
    );
  });

  it('applies classNames to the save button of the markup bar', async () => {
    mockPdf();
    render(<DocViewer {...PDF} withMarkup classNames={{ markupSave: 'app-save' }} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Markup' }));
    expect(document.querySelector('.app-save')).toHaveTextContent('Save');
  });
});
