import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { centerOf, ITEM, mockItemLayout, pointerDrag } from '../../../test-utils/pointer-drag';
import { EditorViewer, type EditorViewerProps } from '../../../test-utils/page-editor';

const items = (listbox: HTMLElement) => within(listbox).getAllByRole('option');

async function openThumbnails(props: EditorViewerProps = {}, numPages = 3) {
  mockPdf({ numPages });
  const onDocumentChange = jest.fn();
  const { editor, ...others } = props;
  render(
    <EditorViewer
      defaultThumbnailsOpened
      editor={editor === false ? false : { onDocumentChange, ...editor }}
      {...others}
    />
  );
  const listbox = await screen.findByRole('listbox', { name: 'Pages' });
  await waitFor(() => expect(items(listbox)).toHaveLength(numPages));
  return { listbox, onDocumentChange };
}

beforeEach(() => getDocument.mockReset());

describe('delete pages from the thumbnails', () => {
  it('has a delete button on each thumbnail, and deleting shows the shorter document', async () => {
    const { onDocumentChange } = await openThumbnails();
    expect(screen.getAllByRole('button', { name: /^Delete page/ })).toHaveLength(3);

    await userEvent.click(screen.getByRole('button', { name: 'Delete page 2' }));

    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70, 45]), {
        reason: 'delete',
        pages: [1, 3],
      })
    );
    expect(await screen.findByText(/1 page removed/)).toBeInTheDocument();
  });

  it('advertises Delete on the thumbnails', async () => {
    const { listbox } = await openThumbnails();
    expect(listbox).toHaveAttribute('aria-keyshortcuts', 'Delete Backspace');
  });

  it('deletes the focused thumbnail with the Delete key', async () => {
    const { listbox, onDocumentChange } = await openThumbnails();
    const thumbnail = items(listbox)[2];
    thumbnail.focus();
    fireEvent.keyDown(thumbnail, { key: 'Delete' });

    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'delete',
        pages: [1, 2],
      })
    );
  });

  it('deletes with Backspace too', async () => {
    const { listbox, onDocumentChange } = await openThumbnails();
    fireEvent.keyDown(items(listbox)[0], { key: 'Backspace' });
    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'delete',
        pages: [2, 3],
      })
    );
  });

  it('keeps the last page: no delete button, and Delete does nothing', async () => {
    const { listbox, onDocumentChange } = await openThumbnails({}, 1);
    expect(screen.queryByRole('button', { name: /^Delete page/ })).not.toBeInTheDocument();
    fireEvent.keyDown(items(listbox)[0], { key: 'Delete' });
    await act(async () => {});
    expect(onDocumentChange).not.toHaveBeenCalled();
    expect(items(listbox)).toHaveLength(1);
  });

  it('is off without the editor, and with withThumbnailEditing false', async () => {
    await openThumbnails({ editor: false });
    expect(screen.queryByRole('button', { name: /^Delete page/ })).not.toBeInTheDocument();
    document.body.innerHTML = '';

    const { listbox } = await openThumbnails({ editor: { withThumbnailEditing: false } });
    expect(screen.queryByRole('button', { name: /^Delete page/ })).not.toBeInTheDocument();
    expect(listbox.querySelector('[data-reorder-item]')).toBeNull();
  });

  it('shows the edited document without onDocumentChange', async () => {
    await openThumbnails({ editor: { onDocumentChange: undefined } });
    await userEvent.click(screen.getByRole('button', { name: 'Delete page 1' }));
    expect(await screen.findByText(/1 page removed/)).toBeInTheDocument();
  });

  it('names the delete buttons with the labels option', async () => {
    await openThumbnails({ editor: { labels: { deletePageLabel: (page) => `Remove ${page}` } } });
    expect(screen.getByRole('button', { name: 'Remove 2' })).toBeInTheDocument();
  });
});

describe('drag thumbnails to reorder pages', () => {
  let layout: jest.SpyInstance;
  afterEach(() => layout?.mockRestore());

  const beforeItem = (listbox: HTMLElement, index: number): [number, number] => {
    const [x, y] = centerOf(items(listbox)[index]);
    return [x - ITEM.width / 2 + 5, y];
  };

  it('do not drag without the editor', async () => {
    layout = mockItemLayout('vertical');
    const { listbox } = await openThumbnails({ editor: false });
    expect(listbox.querySelector('[data-reorder-item]')).toBeNull();
    expect(listbox.querySelector('.mantine-DocViewer-dragHandle')).toBeNull();
  });

  it('reorder the document when dragged in the side rail, and report it to onDocumentChange', async () => {
    layout = mockItemLayout('vertical');
    const { listbox, onDocumentChange } = await openThumbnails();
    const [x, y] = centerOf(items(listbox)[2]);
    pointerDrag(items(listbox)[0], { path: [[x, y + 40]] });

    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'reorder',
        pages: [2, 3, 1],
      })
    );
    expect(getDocument).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.any(Uint8Array) })
    );
    expect(screen.getAllByText('Page 1 moved to position 3', { exact: false })).not.toHaveLength(0);
  });

  it('reorder in a horizontal strip, and scroll it sideways near its ends', async () => {
    layout = mockItemLayout('horizontal');
    const scrollBy = jest.spyOn(Element.prototype, 'scrollBy');
    const { listbox, onDocumentChange } = await openThumbnails({
      defaultThumbnailsPosition: 'bottom',
    });
    pointerDrag(items(listbox)[2], { path: [[10, 150], beforeItem(listbox, 0)] });
    expect(scrollBy).toHaveBeenCalledWith({ left: -16 });
    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'reorder',
        pages: [3, 1, 2],
      })
    );
    scrollBy.mockRestore();
  });

  it('only change the view without onDocumentChange: a drag never downloads', async () => {
    layout = mockItemLayout('vertical');
    const createObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:edited');
    const { listbox } = await openThumbnails({ editor: { onDocumentChange: undefined } });
    const [x, y] = centerOf(items(listbox)[2]);
    pointerDrag(items(listbox)[0], { path: [[x, y + 40]] });
    await waitFor(() =>
      expect(getDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.any(Uint8Array) })
      )
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    URL.createObjectURL = createObjectURL;
  });
});
