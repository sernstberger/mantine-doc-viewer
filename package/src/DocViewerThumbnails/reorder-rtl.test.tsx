import { DirectionProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../../../test-utils/render-legacy';

const items = (listbox: HTMLElement) => within(listbox).getAllByRole('option');

describe('thumbnail keys in a right-to-left app', () => {
  it('swaps Left and Right between thumbnails', async () => {
    mockPdf();
    render(
      <DirectionProvider initialDirection="rtl" detectDirection={false}>
        <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultThumbnailsOpened />
      </DirectionProvider>
    );
    const listbox = await screen.findByRole('listbox', { name: 'Pages' });
    await waitFor(() => expect(items(listbox)).toHaveLength(3));
    items(listbox)[1].focus();

    fireEvent.keyDown(items(listbox)[1], { key: 'ArrowRight' });
    await waitFor(() => expect(items(listbox)[0]).toHaveFocus());
    fireEvent.keyDown(items(listbox)[0], { key: 'ArrowLeft' });
    await waitFor(() => expect(items(listbox)[1]).toHaveFocus());
  });
});
