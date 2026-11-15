import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewer';
import { focusThumbnail, getFocusedThumbnailViewer } from './thumbnail-focus';

async function openThumbnails() {
  mockPdf();
  render(
    <DocViewer
      src="/files/report.pdf"
      pdfWorkerSrc="/worker.mjs"
      defaultThumbnailsOpened
      withPageEditing
      onSave={jest.fn()}
    />
  );
  const listbox = await screen.findByRole('listbox', { name: 'Pages' });
  await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(3));
  return listbox;
}

const reloaded = () =>
  waitFor(() =>
    expect(getDocument).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.any(Uint8Array) })
    )
  );

describe('focus on the thumbnails across a sidebar edit', () => {
  beforeEach(() => getDocument.mockReset());

  it('focuses the page in the same place after Delete reloads the document', async () => {
    const listbox = await openThumbnails();
    const second = within(listbox).getByRole('option', { name: 'Page 2' });
    act(() => second.focus());
    await userEvent.keyboard('{Delete}');
    await reloaded();

    await waitFor(() => expect(screen.getByRole('option', { name: 'Page 2' })).toHaveFocus());
    // Delete again works without finding the list first
    await userEvent.keyboard('{Delete}');
    await waitFor(() => expect(getDocument).toHaveBeenCalledTimes(3));
  });

  it('leaves focus alone when the edit came from somewhere else', async () => {
    await openThumbnails();
    act(() => screen.getByRole('region', { name: 'report.pdf' }).focus());
    fireEvent.click(screen.getByRole('button', { name: 'Delete page 3' }));
    await reloaded();

    expect(screen.getByRole('region', { name: 'report.pdf' })).toHaveFocus();
  });

  it('finds nothing outside a viewer', () => {
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    option.tabIndex = -1;
    const list = document.createElement('div');
    list.setAttribute('role', 'listbox');
    list.append(option);
    document.body.append(list);

    option.focus();
    expect(getFocusedThumbnailViewer()).toBeNull();
    focusThumbnail(null, 1);
    expect(option).toHaveFocus();
    list.remove();
  });
});
