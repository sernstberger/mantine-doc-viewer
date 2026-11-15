import { render, screen } from '@mantine-tests/core';
import React, { useEffect } from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { useDocViewerContext as useContextValue } from '../doc-viewer.context';
import { DocViewerBody, useDocViewerContext } from './DocViewerBody';

describe('mantine-doc-viewer/DocViewerBody', () => {
  it('renders a focusable region named after the document, or a plain body when not focusable', () => {
    function View() {
      const { title } = useDocViewerContext();
      return (
        <>
          <DocViewerBody data-testid="a" className="x">
            {title}
          </DocViewerBody>
          <DocViewerBody data-testid="b" focusable={false} />
        </>
      );
    }
    render(
      <TestDocViewer src="/files/doc.bin" fileName="doc.bin">
        <View />
      </TestDocViewer>
    );
    expect(screen.getByTestId('a')).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('a')).toHaveAttribute('aria-label', 'doc.bin');
    expect(screen.getByTestId('b')).not.toHaveAttribute('role');
  });

  it('throws outside a viewer', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useContextValue();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('DocViewer.Root component was not found in the tree');
    spy.mockRestore();
  });
});

describe('onLoad and onError helpers for custom views', () => {
  function Sheet({ fail }: { fail?: boolean }) {
    const { onLoad, onError } = useDocViewerContext();
    useEffect(() => {
      fail ? onError(new Error('no sheet')) : onLoad({ numPages: 2 });
    }, [fail, onLoad, onError]);
    return <DocViewerBody>sheet</DocViewerBody>;
  }

  it('onLoad reports the type and MIME type of the file with what it is given', () => {
    const onDocumentLoad = jest.fn();
    render(
      <TestDocViewer
        src="/files/data"
        fileName="data.csv"
        mimeType="text/csv"
        onDocumentLoad={onDocumentLoad}
      >
        <Sheet />
      </TestDocViewer>
    );
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'text',
      mimeType: 'text/csv',
      numPages: 2,
    });
  });

  it('onError reports the error', () => {
    const onDocumentError = jest.fn();
    render(
      <TestDocViewer src="/files/data" fileName="data.csv" onDocumentError={onDocumentError}>
        <Sheet fail />
      </TestDocViewer>
    );
    expect(onDocumentError).toHaveBeenCalledWith(new Error('no sheet'));
  });
});
