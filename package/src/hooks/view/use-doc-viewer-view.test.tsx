import React, { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { render } from '@mantine-tests/core';
import { act, renderHook } from '@testing-library/react';
import { createDocViewer } from '../../doc-viewer.store';
import { DocViewerRoot, type DocViewerRootProps } from '../../DocViewerRoot/DocViewerRoot';
import { useDocViewerView } from './use-doc-viewer-view';

function setup(props: Partial<DocViewerRootProps> = {}) {
  const [store] = createDocViewer();
  const onDocumentLoad = jest.fn();
  const onDocumentError = jest.fn();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider env="test">
      <DocViewerRoot
        src="/files/data.xyz"
        store={store}
        onDocumentLoad={onDocumentLoad}
        onDocumentError={onDocumentError}
        {...props}
      >
        {children}
      </DocViewerRoot>
    </MantineProvider>
  );
  return { store, onDocumentLoad, onDocumentError, ...renderHook(useDocViewerView, { wrapper }) };
}

describe('@mantine/doc-viewer/useDocViewerView', () => {
  it('throws when it is used outside of DocViewer.Root', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(useDocViewerView)).toThrow(
      'DocViewer.Root component was not found in the tree'
    );
    consoleError.mockRestore();
  });

  it('reports a loaded view to the store and to onDocumentLoad', () => {
    const { result, store, onDocumentLoad } = setup();
    expect(store.getState().status).toBe('unsupported');

    act(() => result.current.onLoad({ byteSize: 12 }));
    expect(store.getState()).toMatchObject({
      status: 'ready',
      info: { type: 'unknown', byteSize: 12 },
    });
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'unknown', byteSize: 12 });
  });

  it('uses the mimeType of the document unless the view says another', () => {
    const { result, onDocumentLoad } = setup({
      src: '/files/data',
      mimeType: 'application/x-data',
    });
    act(() => result.current.onLoad());
    expect(onDocumentLoad).toHaveBeenLastCalledWith({
      type: 'unknown',
      mimeType: 'application/x-data',
    });
    act(() => result.current.onLoad({ type: 'text', mimeType: 'text/plain' }));
    expect(onDocumentLoad).toHaveBeenLastCalledWith({ type: 'text', mimeType: 'text/plain' });
  });

  it('reports a failed view to the store and to onDocumentError', () => {
    const { result, store, onDocumentError } = setup();
    const error = new Error('Broken');
    act(() => result.current.onError(error));
    expect(store.getState()).toMatchObject({ status: 'error', error });
    expect(onDocumentError).toHaveBeenCalledWith(error);
  });

  it('returns stable callbacks', () => {
    const { result, rerender } = setup();
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('is usable by a view passed as children', () => {
    function CsvView() {
      const { onLoad } = useDocViewerView();
      useEffect(() => onLoad(), [onLoad]);
      return <div>sheet</div>;
    }
    const [store] = createDocViewer();
    render(
      <DocViewerRoot src="/files/data.xyz" store={store}>
        <CsvView />
      </DocViewerRoot>
    );
    expect(store.getState().status).toBe('ready');
  });
});
