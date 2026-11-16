import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { renderHook } from '@testing-library/react';
import { createDocViewer } from '../../doc-viewer.store';
import { DocViewerRoot } from '../../DocViewerRoot/DocViewerRoot';
import { useDocViewerContext } from './use-doc-viewer-context';

describe('@mantine/doc-viewer/useDocViewerContext', () => {
  it('throws when it is used outside of DocViewer.Root', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(useDocViewerContext)).toThrow(
      'DocViewer.Root component was not found in the tree'
    );
    consoleError.mockRestore();
  });

  it('returns what custom views and controls read, and nothing internal', () => {
    const [store] = createDocViewer();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MantineProvider env="test">
        <DocViewerRoot src="/files/data.csv" store={store} labels={{ documentLabel: 'Sheet' }}>
          {children}
        </DocViewerRoot>
      </MantineProvider>
    );
    const { result } = renderHook(useDocViewerContext, { wrapper });

    expect(Object.keys(result.current).sort()).toEqual([
      'controlProps',
      'fileName',
      'getStyles',
      'labels',
      'src',
      'store',
      'title',
      'type',
    ]);
    expect(result.current).toMatchObject({
      src: '/files/data.csv',
      type: 'text',
      fileName: 'data.csv',
      title: 'data.csv',
      store,
    });
    expect(result.current.labels.documentLabel).toBe('Sheet');
    expect(result.current.getStyles('control').className).toContain('mantine-DocViewer-control');
    expect(result.current.controlProps(true)).toMatchObject({
      variant: 'light',
      'data-pressed': true,
    });
  });
});
