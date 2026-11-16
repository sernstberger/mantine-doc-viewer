import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewerMain } from '../DocViewerMain/DocViewerMain';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import {
  DocViewerPageEditor,
  type DocViewerPageEditorProps,
  type DocViewerPageEditorStylesNames,
} from './DocViewerPageEditor';
import { DocViewerPageEditorButton } from './DocViewerPageEditorButton/DocViewerPageEditorButton';
import { openPageEditor } from './page-editor-actions';
import {
  createEditorContext,
  EditorPartsProvider,
  EditorViewer,
  openEditor,
} from '../../../test-utils/page-editor';

const PAGES = /^Page \d of 3$/;

const TestContainer = createContextContainer(DocViewerPageEditor, EditorPartsProvider, {});

describe('mantine-doc-viewer/DocViewerPageEditor', () => {
  tests.itSupportsSystemProps<DocViewerPageEditorProps, DocViewerPageEditorStylesNames>({
    component: TestContainer,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerPageEditor',
    refType: HTMLDivElement,
    stylesApiSelectors: [
      'editor',
      'editorBar',
      'editorTitle',
      'editorCount',
      'editorPages',
      'editorPage',
      'editorButton',
    ],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-editor',
  });

  tests.itThrowsContextError({
    component: DocViewerPageEditor,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing while the editor is closed', () => {
    render(
      <EditorPartsProvider editor={createEditorContext({ editing: false })}>
        <DocViewerPageEditor data-testid="editor" />
      </EditorPartsProvider>
    );
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
  });
});

describe('page editor keys and selection', () => {
  beforeEach(() => getDocument.mockReset());

  it('moves the focus with the arrow keys, Home and End', async () => {
    const { listbox, stop } = await openEditor();
    expect(stop()).toBe('1');

    fireEvent.keyDown(listbox, { key: 'ArrowRight' });
    expect(stop()).toBe('2');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(stop()).toBe('3');
    fireEvent.keyDown(listbox, { key: 'ArrowLeft' });
    expect(stop()).toBe('2');
    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    expect(stop()).toBe('1');
    fireEvent.keyDown(listbox, { key: 'ArrowLeft' });
    expect(stop()).toBe('1');

    fireEvent.keyDown(listbox, { key: 'End' });
    expect(stop()).toBe('3');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(stop()).toBe('1');
    fireEvent.keyDown(listbox, { key: 'x' });
  });

  it('selects and deselects with Space, clicks and modifier clicks', async () => {
    const { listbox, option } = await openEditor();
    const selected = (page: number) => option(page).getAttribute('aria-selected');

    fireEvent.keyDown(listbox, { key: ' ' });
    expect(selected(1)).toBe('true');
    fireEvent.keyDown(listbox, { key: ' ' });
    expect(selected(1)).toBe('false');

    await userEvent.click(option(2));
    expect(selected(2)).toBe('true');
    await userEvent.click(option(2));
    expect(selected(2)).toBe('false');

    await userEvent.click(option(1));
    await userEvent.click(option(3));
    expect([selected(1), selected(3)]).toEqual(['false', 'true']);

    fireEvent.click(option(1), { shiftKey: true });
    fireEvent.click(option(2), { ctrlKey: true });
    fireEvent.click(option(3), { metaKey: true });
    expect([selected(1), selected(2), selected(3)]).toEqual(['true', 'true', 'false']);

    fireEvent.keyDown(listbox, { key: 'a', ctrlKey: true });
    expect([selected(1), selected(2), selected(3)]).toEqual(['true', 'true', 'true']);
  });

  it('removes the focused page with Backspace', async () => {
    const { listbox, order } = await openEditor();
    fireEvent.keyDown(listbox, { key: 'Backspace' });
    expect(order()).toEqual(['2', '3']);
    expect(screen.getByRole('status')).toHaveTextContent('1 page removed');
  });

  it('turns pages with R, and Reset undoes the turns', async () => {
    const { listbox, option } = await openEditor();
    fireEvent.keyDown(listbox, { key: 'r' });
    expect(option(1)).toHaveAttribute('data-rotation', '90');
    expect(screen.getByRole('status')).toHaveTextContent('1 page turned');

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(option(1)).not.toHaveAttribute('data-rotation');
  });

  it('clears the selection with Escape, then leaves the editor', async () => {
    await openEditor();
    const first = await screen.findByRole('option', { name: 'Page 1, position 1 of 3' });
    act(() => first.focus());

    await userEvent.keyboard('{ }');
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Pages' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit pages' })).toHaveFocus());
  });
});

describe('page editor results', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => getDocument.mockReset());
  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('finishes without a new document when nothing changed', async () => {
    const { onDocumentChange } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(await screen.findAllByRole('group', { name: PAGES })).toHaveLength(3);
    expect(getDocument).toHaveBeenCalledTimes(1);
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it('opens the edited document when done', async () => {
    const { order, option } = await openEditor();
    await userEvent.click(option(3));
    await userEvent.click(screen.getByRole('button', { name: 'Move earlier' }));
    expect(order()).toEqual(['1', '3', '2']);
    await userEvent.click(screen.getByRole('button', { name: 'Move later' }));
    expect(order()).toEqual(['1', '2', '3']);
    await userEvent.click(screen.getByRole('button', { name: 'Move earlier' }));

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(getDocument).toHaveBeenCalledTimes(2));
    expect(getDocument.mock.calls[1][0]).toMatchObject({ data: expect.any(Uint8Array) });
    expect(await screen.findAllByRole('group', { name: PAGES })).toHaveLength(3);
  });

  it('saves the edited document to onDocumentChange and shows it', async () => {
    const { listbox, onDocumentChange } = await openEditor();
    fireEvent.keyDown(listbox, { key: 'Delete' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onDocumentChange).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'save',
        pages: [2, 3],
      })
    );
    await waitFor(() => expect(getDocument).toHaveBeenCalledTimes(2));
  });

  it('gives extracted pages to onExtract', async () => {
    const { option, onExtract } = await openEditor();
    await userEvent.click(option(2));
    await userEvent.click(screen.getByRole('button', { name: 'Extract selected' }));
    await waitFor(() =>
      expect(onExtract).toHaveBeenCalledWith(expect.any(Uint8Array), { pages: [2] })
    );
  });

  it('downloads the extracted pages without onExtract', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:pages');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { option } = await openEditor({ editor: { onExtract: undefined } });
    await userEvent.click(option(2));
    await userEvent.click(screen.getByRole('button', { name: 'Extract selected' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('report-pages.pdf');
    click.mockRestore();
  });
});

describe('page editor focus', () => {
  beforeEach(() => getDocument.mockReset());

  it('moves into the page editor and back to Edit pages when it closes', async () => {
    await openEditor();
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Page 1, position 1 of 3' })).toHaveFocus()
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit pages' })).toHaveFocus());
  });

  it('comes back to Edit pages after the edited document has loaded', async () => {
    await openEditor();
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
    const [store] = createDocViewer();
    render(
      <>
        <input aria-label="App field" />
        <EditorViewer store={store} />
      </>
    );
    await screen.findByRole('button', { name: 'Edit pages' });
    const field = screen.getByRole('textbox', { name: 'App field' });
    act(() => field.focus());

    act(() => openPageEditor(store));
    await screen.findByRole('listbox', { name: 'Pages' });
    expect(field).toHaveFocus();
  });
});

describe('page editor options and Styles API', () => {
  beforeEach(() => getDocument.mockReset());

  const BUTTONS = [
    'Move earlier',
    'Move later',
    'Delete',
    'Extract selected',
    'Reset',
    'Cancel',
    'Done',
    'Save',
  ];

  it('shows icon-only buttons that keep their names with compact', async () => {
    await openEditor({
      editor: { compact: true },
      classNames: { editorButton: 'my-editor-button' },
    });
    BUTTONS.forEach((name) => {
      const button = screen.getByRole('button', { name });
      expect(button).not.toHaveTextContent(name);
      expect(button).toHaveClass('my-editor-button');
    });
  });

  it('shows labelled buttons by default, with Root classNames on its parts', async () => {
    await openEditor({
      classNames: {
        editorButton: 'my-editor-button',
        editorTitle: 'app-title',
        editorCount: 'app-count',
      },
    });
    expect(screen.getByRole('button', { name: 'Move earlier' })).toHaveTextContent('Move earlier');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('my-editor-button');
    expect(screen.getByText('Edit pages', { selector: 'p' })).toHaveClass('app-title');
    expect(document.querySelector('.app-count')).toHaveTextContent('0 selected');
  });

  it('takes its text from the labels option', async () => {
    mockPdf();
    render(
      <EditorViewer
        editor={{
          labels: { editPagesLabel: 'Arrange', savePagesLabel: 'Keep', pagesLabel: 'Sheets' },
        }}
      />
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Arrange' }));
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Sheets' })).toBeInTheDocument();
  });

  it('is shown by Main in place of the pages', async () => {
    mockPdf();
    render(
      <EditorViewer>
        <DocViewerToolbar>
          <DocViewerPageEditorButton />
        </DocViewerToolbar>
        <DocViewerMain />
      </EditorViewer>
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    expect(screen.getByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.queryAllByRole('group', { name: PAGES })).toHaveLength(0);
  });
});

describe('page tile renders', () => {
  beforeEach(() => getDocument.mockReset());

  it('renders only the tiles whose focus moved, and none for new options objects', async () => {
    mockPdf({ numPages: 12 });
    const tileRenders = jest.fn((page: number, position: number) => `Page ${page} at ${position}`);
    function App() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            Render
          </button>
          <EditorViewer defaultZoom={1} editor={{ labels: { editorPageLabel: tileRenders } }} />
        </>
      );
    }
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
    const first = await screen.findByRole('option', { name: 'Page 1 at 1' });
    await act(async () => {});
    act(() => first.focus());

    const pagesSince = (from: number) =>
      tileRenders.mock.calls
        .slice(from)
        .map(([page]) => page)
        .sort((a, b) => a - b);

    let before = tileRenders.mock.calls.length;
    await userEvent.keyboard('{ArrowRight}');
    await act(async () => {});
    expect(pagesSince(before)).toEqual([1, 2]);

    before = tileRenders.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Render' }));
    await act(async () => {});
    expect(pagesSince(before)).toEqual([]);
  });
});
