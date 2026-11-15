import { render } from '@mantine-tests/core';
import React from 'react';
import { DocViewer } from './DocViewer';

describe('onDocumentLoadStart', () => {
  it('is called on mount and again when src changes', () => {
    const onDocumentLoadStart = jest.fn();
    const { rerender } = render(
      <DocViewer src="/files/a.png" onDocumentLoadStart={onDocumentLoadStart} />
    );
    expect(onDocumentLoadStart).toHaveBeenCalledWith({ type: 'image', src: '/files/a.png' });

    rerender(<DocViewer src="/files/b.png" onDocumentLoadStart={onDocumentLoadStart} />);
    expect(onDocumentLoadStart).toHaveBeenLastCalledWith({ type: 'image', src: '/files/b.png' });
    expect(onDocumentLoadStart).toHaveBeenCalledTimes(2);
  });
});
