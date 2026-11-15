import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestDocViewer } from '../../test-utils/viewer';
import { DocViewerBody } from './DocViewerBody/DocViewerBody';
import { DocViewerToolbar } from './DocViewerToolbar/DocViewerToolbar';

describe('DocViewer presentation', () => {
  it('renders images with the file name in the toolbar', () => {
    const { container } = render(<TestDocViewer src="https://example.com/files/photo.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/files/photo.png');
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(container.querySelector('[data-doc-type]')).toHaveAttribute('data-doc-type', 'image');
  });

  it('shows a download link for types it cannot render yet', () => {
    render(<TestDocViewer src="/files/archive.zip" />);
    expect(screen.getByText('Preview is not available for this file type')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      '/files/archive.zip'
    );
  });

  it('uses the type prop over detection', () => {
    render(<TestDocViewer src="/files/blob" type="image" fileName="scan.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'scan.png');
  });

  it('hides the toolbar when withToolbar is false', () => {
    render(<TestDocViewer src="/files/photo.png" withToolbar={false} />);
    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
  });

  describe('styling props', () => {
    it('sets CSS variables from props', () => {
      const { container } = render(
        <TestDocViewer
          src="/files/archive.zip"
          size="lg"
          color="teal"
          pagesProps={{ gap: 'xl', matchColor: 'grape' }}
          thumbnailsProps={{ width: 80 }}
        />
      );
      const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root.style.getPropertyValue('--doc-viewer-color')).toBe(
        'var(--mantine-color-teal-filled)'
      );
      expect(root.style.getPropertyValue('--doc-viewer-match-color')).toBe(
        'var(--mantine-color-grape-filled)'
      );
      expect(root.style.getPropertyValue('--doc-viewer-page-gap')).toBe(
        'var(--mantine-spacing-xl)'
      );
      expect(root.style.getPropertyValue('--doc-viewer-thumbnails-width')).toBe(
        'calc(5rem * var(--mantine-scale))'
      );
    });

    it('gives toolbar buttons the control selector and classNames', () => {
      render(<TestDocViewer src="/files/archive.zip" classNames={{ control: 'my-control' }} />);
      expect(screen.getByRole('link', { name: 'Download' })).toHaveClass(
        'mantine-DocViewer-control',
        'my-control'
      );
    });

    it('puts the attributes prop on inner elements, not on the root as an HTML attribute', () => {
      const { container } = render(
        <TestDocViewer
          src="/files/archive.zip"
          attributes={{ root: { 'data-app': 'locker' }, control: { 'data-testid': 'control' } }}
        />
      );
      const root = container.querySelector('.mantine-DocViewer-root');
      expect(root).toHaveAttribute('data-app', 'locker');
      expect(root).not.toHaveAttribute('attributes');
      expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
        'data-testid',
        'control'
      );
    });
  });

  it('shows a full screen button where the browser supports it', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;

    render(<TestDocViewer src="/files/archive.zip" />);
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenEnabled', { value: undefined, configurable: true });
  });

  it('lays out custom children in place of the default toolbar and body', () => {
    render(
      <TestDocViewer src="/files/table.csv" fileName="table.csv">
        <DocViewerToolbar />
        <DocViewerBody>Rows of table.csv</DocViewerBody>
      </TestDocViewer>
    );

    expect(screen.getByRole('region', { name: 'table.csv' })).toHaveTextContent(
      'Rows of table.csv'
    );
    expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
  });

  describe('customisation', () => {
    it('hides toolbar controls named in toolbarControls', () => {
      render(
        <TestDocViewer
          src="/files/archive.zip"
          toolbarControls={{ download: false, title: false, fullscreen: false }}
        />
      );
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByText('archive.zip')).not.toBeInTheDocument();
    });

    it('shows print, download and full screen unless toolbarControls hide them', () => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
      const loadImage = () => {
        const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
        Object.defineProperty(image, 'naturalWidth', { value: 800 });
        Object.defineProperty(image, 'naturalHeight', { value: 400 });
        fireEvent.load(image);
      };
      const { rerender } = render(<TestDocViewer src="/files/photo.png" />);
      loadImage();
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();

      rerender(
        <TestDocViewer
          src="/files/photo.png"
          toolbarControls={{ print: false, download: false, fullscreen: false }}
        />
      );
      loadImage();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();

      rerender(<TestDocViewer src="/files/photo.png" toolbarControls={{ fullscreen: false }} />);
      loadImage();
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
      delete (document as any).fullscreenEnabled;
    });

    it('sets the plain variant, page background and page colour scheme', () => {
      const { container } = render(
        <TestDocViewer
          src="/files/archive.zip"
          variant="plain"
          pageBackground="gray.0"
          pageColorScheme="auto"
        />
      );
      const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;
      expect(root).toHaveAttribute('data-variant', 'plain');
      expect(root).toHaveAttribute('data-page-color-scheme', 'auto');
      expect(root.style.getPropertyValue('--doc-viewer-page-background')).toBe(
        'var(--mantine-color-gray-0)'
      );
    });

    it('sets every colour and size variable of the root, and the dark page scheme', () => {
      const { container } = render(
        <TestDocViewer
          src="data:image/png;base64,AAAA"
          pageColorScheme="dark"
          size="lg"
          color="red"
          pageBackground="gray"
          pagesProps={{ matchColor: 'blue', activeMatchColor: 'green', gap: 'xl' }}
          thumbnailsProps={{ width: 0 }}
        />
      );
      const root = container.querySelector('[data-doc-type]')!;
      expect(root).toHaveAttribute('data-page-color-scheme', 'dark');
      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root.getAttribute('style')).toContain('--doc-viewer-match-color');
    });

    it('omits the colour scheme attribute for light pages and data-size for css sizes', () => {
      const { container } = render(
        <TestDocViewer src="/a.png" pageColorScheme="light" size={'5rem' as any} />
      );
      const root = container.querySelector('[data-doc-type]')!;
      expect(root).not.toHaveAttribute('data-page-color-scheme');
      expect(root).not.toHaveAttribute('data-size');
    });

    it('falls back to the sm toolbar when size is explicitly null', () => {
      const { container } = render(<TestDocViewer src="/a.png" size={null as any} />);
      expect(container.querySelector('[data-doc-type]')!.getAttribute('style')).toContain(
        '--doc-viewer-toolbar-height'
      );
    });

    it('leaves the default page colours alone', () => {
      const { container } = render(
        <TestDocViewer src="/files/archive.zip" pageColorScheme="light" />
      );
      expect(container.querySelector('.mantine-DocViewer-root')).not.toHaveAttribute(
        'data-page-color-scheme'
      );
    });
  });
});
