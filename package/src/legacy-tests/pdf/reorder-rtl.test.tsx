import { DirectionProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockPdf } from '../../../../test-utils/mock-pdf';
import { centerOf, ITEM, mockItemLayout, pointerDrag } from '../../../../test-utils/pointer-drag';
import { DocViewer } from '../../DocViewerRoot/DocViewerRoot';

const items = (listbox: HTMLElement) => within(listbox).getAllByRole('option');

async function openEditor(dir: 'ltr' | 'rtl', compact = false) {
  mockPdf();
  render(
    <DirectionProvider initialDirection={dir} detectDirection={false}>
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        withPageEditing
        compactPageEditor={compact}
      />
    </DirectionProvider>
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  const listbox = screen.getByRole('listbox', { name: 'Pages' });
  const order = () => items(listbox).map((option) => option.getAttribute('data-page'));
  return { listbox, order };
}

describe('drag to reorder pages in a right-to-left app', () => {
  let layout: jest.SpyInstance;
  afterEach(() => layout?.mockRestore());

  it('drops before a page on its right half, where the page starts', async () => {
    layout = mockItemLayout('grid', true);
    const { listbox, order } = await openEditor('rtl');
    const [x, y] = centerOf(items(listbox)[0]);

    const release = pointerDrag(items(listbox)[2], {
      path: [[x + ITEM.width / 2 - 5, y]],
      hold: true,
    });
    expect(items(listbox)[0]).toHaveAttribute('data-drop', 'before');
    release();
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('drops after a page on its left half', async () => {
    layout = mockItemLayout('grid', true);
    const { listbox, order } = await openEditor('rtl');
    const [x, y] = centerOf(items(listbox)[0]);

    pointerDrag(items(listbox)[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['1', '3', '2']);
  });

  it('keeps reading the left half as "before" in a left-to-right app', async () => {
    layout = mockItemLayout('grid');
    const { listbox, order } = await openEditor('ltr');
    const [x, y] = centerOf(items(listbox)[0]);

    pointerDrag(items(listbox)[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['3', '1', '2']);
  });
});

describe('page order keys and icons in a right-to-left app', () => {
  const arrowOf = (name: string) => screen.getByRole('button', { name }).innerHTML;

  it('moves the focused page with Alt and the arrow that points where it goes', async () => {
    const { listbox, order } = await openEditor('rtl');
    items(listbox)[0].focus();

    fireEvent.keyDown(listbox, { key: 'ArrowLeft', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
    fireEvent.keyDown(listbox, { key: 'ArrowRight', altKey: true });
    expect(order()).toEqual(['1', '2', '3']);
    fireEvent.keyDown(listbox, { key: 'ArrowDown', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
  });

  it('keeps Left for earlier in a left-to-right app', async () => {
    const { listbox, order } = await openEditor('ltr');
    items(listbox)[0].focus();

    fireEvent.keyDown(listbox, { key: 'ArrowRight', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
  });

  it('mirrors the move earlier and later icons', async () => {
    await openEditor('rtl', true);
    const rtl = [arrowOf('Move earlier'), arrowOf('Move later')];
    document.body.innerHTML = '';
    await openEditor('ltr', true);
    expect(rtl).toEqual([arrowOf('Move later'), arrowOf('Move earlier')]);
  });

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
