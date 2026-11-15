import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestPdfAdapter } from '../../test-utils/adapters';
import { getDocument, mockPdf } from '../../test-utils/mock-pdf';
import {
  createDocViewer,
  createDocViewerStore,
  docViewerActions,
  useDocViewer,
  useDocViewerStore,
} from './doc-viewer.store';
import type * as Types from './doc-viewer.types';
import { DocViewer } from './DocViewer';
import { DocViewerAdapterProvider } from './DocViewerAdapterProvider/DocViewerAdapterProvider';
import { closePageEditor, openPageEditor } from './DocViewerPageEditor/page-editor-actions';
import { createPageEditorExtension } from './DocViewerPageEditor/page-editor-extension';
import { DocViewerPageEditorButton } from './DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton';
import { createMarkupExtension } from './DocViewerMarkup/markup-extension';
import { saveMarkup, setMarkupTool } from './DocViewerMarkup/markup-actions';
import { getControllerRegistry } from './hooks/use-controller-registry';
import './doc-viewer.types';

const zoom: Types.DocViewerZoom = 'fit';

describe('store', () => {
  it('starts empty and keeps two stores apart', () => {
    const first = createDocViewerStore();
    const second = createDocViewerStore();
    docViewerActions.toggleThumbnails(undefined, first);
    expect(first.getState().thumbnailsOpened).toBe(true);
    expect(second.getState()).toMatchObject({ thumbnailsOpened: false, zoom, page: 1 });
  });

  it('does nothing for actions no view registered', async () => {
    const [store, actions] = createDocViewer();
    actions.goToPage(2);
    actions.highlight({ text: 'a' });
    actions.clearHighlight();
    actions.goToSpread(2);
    actions.nextSpread();
    actions.nextSpread({ loop: true });
    actions.previousSpread();
    actions.setZoom(2);
    actions.zoomIn();
    actions.zoomOut();
    actions.setPageLayout('two-page');
    actions.rotate();
    actions.openSearch('a');
    actions.closeSearch();
    actions.togglePresentation();
    actions.download();
    actions.resetReadingProgress();
    expect(actions.getPageCanvas(1)).toBeNull();
    await expect(actions.getOutline()).resolves.toEqual([]);
    await expect(actions.getBytes()).resolves.toBeNull();
    await actions.print();
    await actions.toggleFullscreen();
    openPageEditor(store);
    closePageEditor(store);
    setMarkupTool('pen', store);
    await saveMarkup(store);
    actions.toggleThumbnails(false);
    actions.setThumbnailsPosition('top');
    expect(store.getState()).toMatchObject({ thumbnailsOpened: false, thumbnailsPosition: 'top' });
  });

  it('calls what views registered, and loops to the first spread', async () => {
    const [store, actions] = createDocViewer();
    const registry = getControllerRegistry(store).current;
    registry.goToPage = jest.fn();
    registry.nextSpread = jest.fn();
    registry.getBytes = jest.fn(async () => new Uint8Array([1]));
    registry.getPageCanvas = jest.fn(() => document.createElement('canvas'));
    registry.getOutline = jest.fn(async () => [{ title: 'A', page: 1, url: null, items: [] }]);
    registry.editPages = jest.fn();
    registry.setMarkupTool = jest.fn();

    actions.nextSpread();
    expect(registry.nextSpread).toHaveBeenCalled();
    docViewerActions.updateState({ page: 3, numPages: 3, pageLayout: 'single' }, store);
    actions.nextSpread({ loop: true });
    expect(registry.goToPage).toHaveBeenCalledWith(1);
    await expect(actions.getBytes()).resolves.toEqual(new Uint8Array([1]));
    expect(actions.getPageCanvas(1)).toBeInstanceOf(HTMLCanvasElement);
    await expect(actions.getOutline()).resolves.toHaveLength(1);
    openPageEditor(store);
    expect(registry.editPages).toHaveBeenCalled();
    setMarkupTool(null, store);
    expect(registry.setMarkupTool).toHaveBeenCalledWith(null);
  });

  it('gives a component one store and rerenders subscribers', () => {
    const { result, rerender } = renderHook(() => useDocViewer());
    const [store] = result.current;
    rerender();
    expect(result.current[0]).toBe(store);

    const state = renderHook(() => useDocViewerStore(store));
    act(() => result.current[1].toggleThumbnails(true));
    expect(state.result.current.thumbnailsOpened).toBe(true);
  });
});

describe('store projection and extensions', () => {
  beforeEach(() => getDocument.mockReset());

  it('projects the PDF session into the store and opens and closes the page editor', async () => {
    mockPdf();
    const [store] = createDocViewer();
    const onPageChange = jest.fn();
    render(
      <DocViewerAdapterProvider pdf={createTestPdfAdapter('/worker.mjs')}>
        <DocViewer
          src="/files/report.pdf"
          store={store}
          onPageChange={onPageChange}
          extensions={[
            createPageEditorExtension({ labels: { editPagesLabel: 'Arrange' } }),
            createMarkupExtension(),
          ]}
          toolbarProps={{ rightSection: <DocViewerPageEditorButton data-testid="part" /> }}
        />
      </DocViewerAdapterProvider>
    );
    await screen.findAllByRole('button', { name: 'Arrange' });
    await act(async () => {});
    expect(store.getState()).toMatchObject({ type: 'pdf', numPages: 3, canPrint: true });

    await userEvent.click(screen.getAllByRole('button', { name: 'Arrange' })[1]);
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    await act(async () => closePageEditor(store));
    await screen.findAllByRole('button', { name: 'Arrange' });
    await act(async () => {});
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
