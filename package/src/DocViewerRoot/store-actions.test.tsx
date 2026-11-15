import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import React from 'react';
import { TestDocViewer, type TestDocViewerProps } from '../../../test-utils/viewer';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewer, type DocViewerActions } from '../doc-viewer.store';
import { openPageEditor } from '../DocViewerPageEditor/page-editor-actions';

function renderWithActions(content: React.ReactNode, props: Partial<TestDocViewerProps> = {}) {
  let actions!: DocViewerActions;
  let storeRef!: ReturnType<typeof useDocViewer>[0];
  function App() {
    const [store, docViewerActions] = useDocViewer();
    actions = docViewerActions;
    storeRef = store;
    return (
      <TestDocViewer src="/files/doc.bin" store={store} {...props}>
        {content}
      </TestDocViewer>
    );
  }
  const view = render(<App />);
  return { ...view, actions, store: storeRef };
}

describe('store actions on a mounted viewer', () => {
  it('downloads the document under the name of the file, or without a name', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { actions, unmount } = renderWithActions(null);
    actions.download();
    expect(click.mock.contexts[0]).toMatchObject({ download: 'doc.bin', target: '_blank' });
    unmount();

    const blob = renderWithActions(null, { src: 'blob:x' });
    blob.actions.download();
    expect(click.mock.contexts[1]).toMatchObject({ download: '' });
    click.mockRestore();
  });

  it('does nothing for actions the document has no view for', async () => {
    const { actions, store } = renderWithActions(null);
    const before = store.getState();

    actions.goToPage(2);
    actions.setZoom(1);
    actions.zoomIn();
    actions.zoomOut();
    actions.rotate();
    actions.openSearch();
    actions.closeSearch();
    actions.togglePresentation();
    actions.setPageLayout('single');
    openPageEditor(store);
    await actions.print();
    await actions.toggleFullscreen();
    await expect(actions.getOutline()).resolves.toEqual([]);
    act(() => actions.toggleThumbnails());

    expect(store.getState()).toEqual({ ...before, thumbnailsOpened: true });
  });

  it('calls actions that views register, with their arguments', async () => {
    const goToPage = jest.fn();
    const getOutline = jest.fn(async () => [{ title: 'A', page: 1, url: null, items: [] }]);
    const print = jest.fn(async () => {});
    function View() {
      const { controller } = useDocViewerContext();
      controller.current.goToPage = goToPage;
      controller.current.getOutline = getOutline;
      controller.current.print = print;
      return null;
    }
    const { actions } = renderWithActions(<View />);
    actions.goToPage(3);
    expect(goToPage).toHaveBeenCalledWith(3, undefined);
    await expect(actions.getOutline()).resolves.toHaveLength(1);
    await actions.print();
    expect(print).toHaveBeenCalled();
  });

  it('forwards document events to the latest handlers', () => {
    const onDocumentLoad = jest.fn();
    function View() {
      const { events } = useDocViewerContext();
      events.onDocumentLoad({ type: 'image' });
      return <span>view</span>;
    }
    renderWithActions(<View />, { onDocumentLoad });
    expect(screen.getByText('view')).toBeInTheDocument();
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image' });
  });
});
