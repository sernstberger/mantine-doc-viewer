import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';

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

describe('focus across the page editor and presentations', () => {
  beforeEach(() => getDocument.mockReset());

  it('moves into the page editor and back to Edit pages when it closes', async () => {
    mockPdf();
    renderViewer();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Page 1, position 1 of 3' })).toHaveFocus()
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit pages' })).toHaveFocus());
  });

  it('comes back to Edit pages after the edited document has loaded', async () => {
    mockPdf();
    renderViewer();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    await userEvent.keyboard('{Delete}');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() =>
      expect(getDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.any(Uint8Array) })
      )
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit pages' })).toHaveFocus());
  });

  it('leaves focus in the app when the app opens the editor', async () => {
    mockPdf();
    const controller = renderViewer();
    await screen.findByRole('button', { name: 'Edit pages' });
    const field = screen.getByRole('textbox', { name: 'App field' });
    act(() => field.focus());

    act(() => controller.current!.editPages());
    await screen.findByRole('listbox', { name: 'Pages' });
    expect(field).toHaveFocus();
  });

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
