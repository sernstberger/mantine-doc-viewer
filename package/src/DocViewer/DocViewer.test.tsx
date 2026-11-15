import { render, screen, tests } from '@mantine-tests/core';
import React from 'react';
import { DocViewer, DocViewerProps, DocViewerStylesNames } from './DocViewer';

const defaultProps: DocViewerProps = { src: 'https://example.com/photo.png' };

describe('DocViewer', () => {
  tests.itSupportsSystemProps<DocViewerProps, DocViewerStylesNames>({
    component: DocViewer,
    props: defaultProps,
    styleProps: true,
    extend: true,
    variant: true,
    size: true,
    classes: true,
    refType: HTMLDivElement,
    displayName: 'DocViewer',
    stylesApiSelectors: ['root', 'toolbar', 'title', 'body', 'image'],
  });

  it('renders images with the file name in the toolbar', () => {
    const { container } = render(<DocViewer src="https://example.com/files/photo.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/files/photo.png');
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(container.querySelector('[data-doc-type]')).toHaveAttribute('data-doc-type', 'image');
  });

  it('shows a download link for types it cannot render yet', () => {
    render(<DocViewer src="/files/archive.zip" />);
    expect(screen.getByText('Preview is not available for this file type')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      '/files/archive.zip'
    );
  });

  it('uses the type prop over detection', () => {
    render(<DocViewer src="/files/blob" type="image" fileName="scan.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'scan.png');
  });

  it('hides the toolbar when withToolbar is false', () => {
    render(<DocViewer src="/files/photo.png" withToolbar={false} />);
    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
  });
});
