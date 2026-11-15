import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { TestDocViewer } from '../../../test-utils/viewer';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from './DocViewerMessage';

describe('mantine-doc-viewer/DocViewerMessage', () => {
  it('announces errors as alerts and others as status, with an optional download link', () => {
    render(
      <TestDocViewer src="/files/doc.bin" fileName="doc.bin">
        <DocViewerMessage error withDownload>
          broken
        </DocViewerMessage>
        <DocViewerMessage>plain</DocViewerMessage>
        <DocViewerLoading />
      </TestDocViewer>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('broken');
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'download',
      'doc.bin'
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
  });

  it('has a plain download link without a file name', () => {
    render(
      <TestDocViewer src="blob:abc">
        <DocViewerMessage withDownload>x</DocViewerMessage>
      </TestDocViewer>
    );
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute('download', '');
  });
});
