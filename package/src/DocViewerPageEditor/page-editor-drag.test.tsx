import { DirectionProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import {
  centerOf,
  ITEM,
  LIST,
  mockItemLayout,
  pointerDrag,
} from '../../../test-utils/pointer-drag';
import { editorPages, EditorViewer, openEditor } from '../../../test-utils/page-editor';

const beforeItem = (items: HTMLElement[], index: number): [number, number] => {
  const [x, y] = centerOf(items[index]);
  return [x - ITEM.width / 2 + 5, y];
};

async function openEditorIn(dir: 'ltr' | 'rtl', compact = false) {
  mockPdf();
  render(
    <DirectionProvider initialDirection={dir} detectDirection={false}>
      <EditorViewer editor={{ compact }} />
    </DirectionProvider>
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  return editorPages();
}

let layout: jest.SpyInstance | undefined;
beforeEach(() => getDocument.mockReset());
afterEach(() => {
  layout?.mockRestore();
  layout = undefined;
});

describe('drag to reorder pages in the page editor', () => {
  beforeEach(() => {
    layout = mockItemLayout('grid');
  });

  it('drags a page with the mouse, shows where it will land, and moves it there', async () => {
    const { listbox, items, order } = await openEditor();
    const third = items()[2];
    const release = pointerDrag(third, { path: [beforeItem(items(), 0)], hold: true });

    expect(third).toHaveAttribute('data-dragging');
    expect(third.style.translate).not.toBe('');
    expect(items()[0]).toHaveAttribute('data-drop', 'before');
    expect(listbox).toHaveAttribute('data-dragging');

    release();
    expect(order()).toEqual(['3', '1', '2']);
    expect(screen.getByRole('status')).toHaveTextContent('Page 3 moved to position 1');
    expect(items()[0]).not.toHaveAttribute('data-drop');
  });

  it('marks the end of the list when a page is dragged past the last one', async () => {
    const { items, order } = await openEditor();
    const [x, y] = centerOf(items()[2]);
    const release = pointerDrag(items()[0], { path: [[x + 60, y]], hold: true });
    expect(items()[2]).toHaveAttribute('data-drop', 'after');
    release();
    expect(order()).toEqual(['2', '3', '1']);
  });

  it('does not select the page a drag ends on, but a plain click still does', async () => {
    const { items } = await openEditor();
    pointerDrag(items()[2], { path: [beforeItem(items(), 0)] });
    fireEvent.click(items()[0]);
    expect(screen.getByText('0 selected')).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 350));
    fireEvent.click(items()[1]);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('leaves the order alone for a drop next to the page, or a cancelled drag', async () => {
    const { items, order } = await openEditor();
    const release = pointerDrag(items()[1], { path: [beforeItem(items(), 2)], hold: true });
    expect(items().some((item) => item.hasAttribute('data-drop'))).toBe(false);
    release();
    expect(order()).toEqual(['1', '2', '3']);

    pointerDrag(items()[2], { path: [beforeItem(items(), 0)], cancel: true });
    expect(order()).toEqual(['1', '2', '3']);
  });

  it('drags with touch from the handle only, so swiping a page still scrolls', async () => {
    const { items, order } = await openEditor();
    pointerDrag(items()[2], { pointerType: 'touch', path: [beforeItem(items(), 0)] });
    expect(order()).toEqual(['1', '2', '3']);

    const handle = items()[2].querySelector('.mantine-DocViewer-dragHandle')!;
    pointerDrag(handle, { pointerType: 'touch', path: [beforeItem(items(), 0)] });
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('drags the whole page with the mouse, also when pressed on the handle', async () => {
    const { items, order } = await openEditor();
    const handle = items()[2].querySelector('.mantine-DocViewer-dragHandle')!;
    pointerDrag(handle, { path: [beforeItem(items(), 0)] });
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('scrolls the list when the pointer nears its top or bottom edge', async () => {
    const scrollBy = jest.spyOn(Element.prototype, 'scrollBy');
    const { items } = await openEditor();
    pointerDrag(items()[0], {
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

describe('the page editor in a right-to-left app', () => {
  it('drops before a page on its right half, where the page starts', async () => {
    layout = mockItemLayout('grid', true);
    const { items, order } = await openEditorIn('rtl');
    const [x, y] = centerOf(items()[0]);

    const release = pointerDrag(items()[2], { path: [[x + ITEM.width / 2 - 5, y]], hold: true });
    expect(items()[0]).toHaveAttribute('data-drop', 'before');
    release();
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('drops after a page on its left half', async () => {
    layout = mockItemLayout('grid', true);
    const { items, order } = await openEditorIn('rtl');
    const [x, y] = centerOf(items()[0]);

    pointerDrag(items()[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['1', '3', '2']);
  });

  it('keeps reading the left half as "before" in a left-to-right app', async () => {
    layout = mockItemLayout('grid');
    const { items, order } = await openEditorIn('ltr');
    const [x, y] = centerOf(items()[0]);

    pointerDrag(items()[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('moves the focused page with Alt and the arrow that points where it goes', async () => {
    const { listbox, items, order } = await openEditorIn('rtl');
    items()[0].focus();

    fireEvent.keyDown(listbox, { key: 'ArrowLeft', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
    fireEvent.keyDown(listbox, { key: 'ArrowRight', altKey: true });
    expect(order()).toEqual(['1', '2', '3']);
    fireEvent.keyDown(listbox, { key: 'ArrowDown', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
  });

  it('keeps Left for earlier in a left-to-right app', async () => {
    const { listbox, items, order } = await openEditorIn('ltr');
    items()[0].focus();

    fireEvent.keyDown(listbox, { key: 'ArrowRight', altKey: true });
    expect(order()).toEqual(['2', '1', '3']);
  });

  it('mirrors the move earlier and later icons', async () => {
    const arrowOf = (name: string) => screen.getByRole('button', { name }).innerHTML;
    await openEditorIn('rtl', true);
    const rtl = [arrowOf('Move earlier'), arrowOf('Move later')];
    document.body.innerHTML = '';
    await openEditorIn('ltr', true);
    expect(rtl).toEqual([arrowOf('Move later'), arrowOf('Move earlier')]);
  });
});
