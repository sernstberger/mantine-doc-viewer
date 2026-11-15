import { render, screen } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { type DocViewerController, DocViewer } from '../../../../test-utils/render-legacy';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

function renderViewer() {
  const controller = createRef<DocViewerController>();
  render(
    <>
      <input aria-label="App field" />
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        withPageEditing
        controllerRef={controller}
      />
    </>
  );
  return controller;
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
