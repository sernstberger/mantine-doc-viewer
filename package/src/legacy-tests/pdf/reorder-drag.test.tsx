import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import {
  centerOf,
  ITEM,
  LIST,
  mockItemLayout,
  pointerDrag,
} from '../../../../test-utils/pointer-drag';
import { DocViewer } from '../../DocViewerRoot/DocViewerRoot';

type Props = Partial<React.ComponentProps<typeof DocViewer>>;

const items = (listbox: HTMLElement) => within(listbox).getAllByRole('option');

/** A point in the gap before item `index` of a grid or a strip (same row) */
const beforeItem = (listbox: HTMLElement, index: number): [number, number] => {
  const [x, y] = centerOf(items(listbox)[index]);
  return [x - ITEM.width / 2 + 5, y];
};

async function openEditor(props: Props = {}) {
  mockPdf();
  const onSave = jest.fn();
  render(
    <DocViewer
      src="/files/report.pdf"
      pdfWorkerSrc="/worker.mjs"
      withPageEditing
      onSave={onSave}
      {...props}
    />
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  const listbox = screen.getByRole('listbox', { name: 'Pages' });
  const order = () => items(listbox).map((option) => option.getAttribute('data-page'));
  return { listbox, order, onSave };
}

async function openThumbnails(props: Props = {}) {
  mockPdf();
  const onSave = jest.fn();
  render(
    <DocViewer
      src="/files/report.pdf"
      pdfWorkerSrc="/worker.mjs"
      defaultThumbnailsOpened
      onSave={onSave}
      {...props}
    />
  );
  const listbox = await screen.findByRole('listbox', { name: 'Pages' });
  await waitFor(() => expect(items(listbox)).toHaveLength(3));
  return { listbox, onSave };
}

describe('drag to reorder pages', () => {
  let layout: jest.SpyInstance;
  afterEach(() => layout?.mockRestore());

  describe('page editor', () => {
    beforeEach(() => {
      layout = mockItemLayout('grid');
    });

    it('drags a page with the mouse, shows where it will land, and moves it there', async () => {
      const { listbox, order } = await openEditor();
      const [third] = [items(listbox)[2]];
      const release = pointerDrag(third, { path: [beforeItem(listbox, 0)], hold: true });

      expect(third).toHaveAttribute('data-dragging');
      expect(third.style.translate).not.toBe('');
      expect(items(listbox)[0]).toHaveAttribute('data-drop', 'before');
      expect(listbox).toHaveAttribute('data-dragging');

      release();
      expect(order()).toEqual(['3', '1', '2']);
      expect(screen.getByRole('status')).toHaveTextContent('Page 3 moved to position 1');
      expect(items(listbox)[0]).not.toHaveAttribute('data-drop');
    });

    it('marks the end of the list when a page is dragged past the last one', async () => {
      const { listbox, order } = await openEditor();
      const [x, y] = centerOf(items(listbox)[2]);
      const release = pointerDrag(items(listbox)[0], { path: [[x + 60, y]], hold: true });
      expect(items(listbox)[2]).toHaveAttribute('data-drop', 'after');
      release();
      expect(order()).toEqual(['2', '3', '1']);
    });

    it('does not select the page a drag ends on, but a plain click still does', async () => {
      const { listbox } = await openEditor();
      pointerDrag(items(listbox)[2], { path: [beforeItem(listbox, 0)] });
      fireEvent.click(items(listbox)[0]);
      expect(screen.getByText('0 selected')).toBeInTheDocument();

      // Clicks after the drag's short window count again
      await new Promise((resolve) => setTimeout(resolve, 350));
      fireEvent.click(items(listbox)[1]);
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('leaves the order alone for a drop next to the page, or a cancelled drag', async () => {
      const { listbox, order } = await openEditor();
      const release = pointerDrag(items(listbox)[1], {
        path: [beforeItem(listbox, 2)],
        hold: true,
      });
      // Dropping right after itself changes nothing, so no marker either
      expect(items(listbox).some((item) => item.hasAttribute('data-drop'))).toBe(false);
      release();
      expect(order()).toEqual(['1', '2', '3']);

      pointerDrag(items(listbox)[2], { path: [beforeItem(listbox, 0)], cancel: true });
      expect(order()).toEqual(['1', '2', '3']);
    });

    it('drags with touch from the handle only, so swiping a page still scrolls', async () => {
      const { listbox, order } = await openEditor();
      pointerDrag(items(listbox)[2], { pointerType: 'touch', path: [beforeItem(listbox, 0)] });
      expect(order()).toEqual(['1', '2', '3']);

      const handle = items(listbox)[2].querySelector('.mantine-DocViewer-dragHandle')!;
      pointerDrag(handle, { pointerType: 'touch', path: [beforeItem(listbox, 0)] });
      expect(order()).toEqual(['3', '1', '2']);
    });

    it('drags the whole page with the mouse, also when pressed on the handle', async () => {
      const { listbox, order } = await openEditor();
      const handle = items(listbox)[2].querySelector('.mantine-DocViewer-dragHandle')!;
      pointerDrag(handle, { path: [beforeItem(listbox, 0)] });
      expect(order()).toEqual(['3', '1', '2']);
    });

    it('scrolls the list when the pointer nears its top or bottom edge', async () => {
      const scrollBy = jest.spyOn(Element.prototype, 'scrollBy');
      const { listbox } = await openEditor();
      pointerDrag(items(listbox)[0], {
        path: [
          [150, 10],
          [150, LIST.height - 10],
          [150, 400],
        ],
      });
      expect(scrollBy).toHaveBeenNthCalledWith(1, { top: -16 });
      expect(scrollBy).toHaveBeenNthCalledWith(2, { top: 16 });
      expect(scrollBy).toHaveBeenCalledTimes(2);
      scrollBy.mockRestore();
    });
  });

  describe('thumbnails', () => {
    it('do not drag unless page editing is on', async () => {
      layout = mockItemLayout('vertical');
      const { listbox } = await openThumbnails();
      expect(listbox.querySelector('[data-reorder-item]')).toBeNull();
      expect(listbox.querySelector('.mantine-DocViewer-dragHandle')).toBeNull();
    });

    it('reorder the document when dragged in the side rail, and report it to onSave', async () => {
      layout = mockItemLayout('vertical');
      const { listbox, onSave } = await openThumbnails({ withPageEditing: true });
      const [x, y] = centerOf(items(listbox)[2]);
      pointerDrag(items(listbox)[0], { path: [[x, y + 40]] });

      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
          reason: 'reorder',
          pages: [2, 3, 1],
        })
      );
      // The viewer opens the reordered bytes instead of the file
      expect(getDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.any(Uint8Array) })
      );
      expect(screen.getAllByText('Page 1 moved to position 3', { exact: false })).not.toHaveLength(
        0
      );
    });

    it('reorder in a horizontal strip, and scroll it sideways near its ends', async () => {
      layout = mockItemLayout('horizontal');
      const scrollBy = jest.spyOn(Element.prototype, 'scrollBy');
      const { listbox, onSave } = await openThumbnails({
        withPageEditing: true,
        defaultThumbnailsPosition: 'bottom',
      });
      pointerDrag(items(listbox)[2], { path: [[10, 150], beforeItem(listbox, 0)] });
      expect(scrollBy).toHaveBeenCalledWith({ left: -16 });
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
          reason: 'reorder',
          pages: [3, 1, 2],
        })
      );
      scrollBy.mockRestore();
    });

    it('only change the view when there is no onSave: a drag never downloads', async () => {
      layout = mockItemLayout('vertical');
      URL.createObjectURL = jest.fn(() => 'blob:edited');
      const { listbox } = await openThumbnails({ withPageEditing: true, onSave: undefined });
      const [x, y] = centerOf(items(listbox)[2]);
      pointerDrag(items(listbox)[0], { path: [[x, y + 40]] });
      await waitFor(() =>
        expect(getDocument).toHaveBeenLastCalledWith(
          expect.objectContaining({ data: expect.any(Uint8Array) })
        )
      );
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });
});
