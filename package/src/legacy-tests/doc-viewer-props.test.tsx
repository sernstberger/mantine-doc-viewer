import { render, screen } from '@mantine-tests/core';
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { DocViewer } from '../../../test-utils/render-legacy';

describe('DocViewer', () => {
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

  describe('styling props', () => {
    it('sets CSS variables from props', () => {
      const { container } = render(
        <DocViewer
          src="/files/archive.zip"
          size="lg"
          color="teal"
          matchColor="grape"
          pageGap="xl"
          thumbnailWidth={80}
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

    describe('responsive values', () => {
      const { matchMedia } = window;

      // Viewport between theme.breakpoints.sm and md: min-width queries up to sm match
      beforeEach(() => {
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
          matches: /min-width: (36|48)em/.test(query),
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        }));
      });

      afterEach(() => {
        window.matchMedia = matchMedia;
      });

      it('uses the value of the largest matching breakpoint', async () => {
        const { container } = render(
          <DocViewer
            src="/files/archive.zip"
            size={{ base: 'lg', sm: 'xs', lg: 'xl' }}
            pageGap={{ base: 'xs', md: 'xl' }}
            thumbnailWidth={{ base: 64, sm: 96 }}
          />
        );
        const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;

        await waitFor(() => expect(root).toHaveAttribute('data-size', 'xs'));
        expect(root.style.getPropertyValue('--doc-viewer-page-gap')).toBe(
          'var(--mantine-spacing-xs)'
        );
        expect(root.style.getPropertyValue('--doc-viewer-thumbnails-width')).toBe(
          'calc(6rem * var(--mantine-scale))'
        );
      });

      it('falls back to the defaults when no breakpoint has a value', async () => {
        const { container } = render(
          <DocViewer src="/files/archive.zip" size={{ xl: 'xl' }} thumbnailWidth={{ xl: 200 }} />
        );
        const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;

        await waitFor(() => expect(root).toHaveAttribute('data-size', 'sm'));
        expect(root.style.getPropertyValue('--doc-viewer-thumbnails-width')).toBe('');
      });
    });

    it('gives toolbar buttons the control selector and classNames', () => {
      render(<DocViewer src="/files/archive.zip" classNames={{ control: 'my-control' }} />);
      expect(screen.getByRole('link', { name: 'Download' })).toHaveClass(
        'mantine-DocViewer-control',
        'my-control'
      );
    });

    it('puts the attributes prop on inner elements, not on the root as an HTML attribute', () => {
      const { container } = render(
        <DocViewer
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

  describe('customisation', () => {
    it('hides toolbar controls named in toolbarControls', () => {
      render(
        <DocViewer
          src="/files/archive.zip"
          toolbarControls={{ download: false, title: false, fullscreen: false }}
        />
      );
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByText('archive.zip')).not.toBeInTheDocument();
    });

    it('shows print, download and full screen unless toolbarControls or withFullscreen hide them', () => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
      const loadImage = () => {
        const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
        Object.defineProperty(image, 'naturalWidth', { value: 800 });
        Object.defineProperty(image, 'naturalHeight', { value: 400 });
        fireEvent.load(image);
      };
      const { rerender } = render(<DocViewer src="/files/photo.png" />);
      loadImage();
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();

      rerender(
        <DocViewer
          src="/files/photo.png"
          toolbarControls={{ print: false, download: false, fullscreen: false }}
        />
      );
      loadImage();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();

      rerender(<DocViewer src="/files/photo.png" withFullscreen={false} />);
      loadImage();
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
      delete (document as any).fullscreenEnabled;
    });

    it('sets the plain variant, page background and page colour scheme', () => {
      const { container } = render(
        <DocViewer
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

    it('leaves the default page colours alone', () => {
      const { container } = render(<DocViewer src="/files/archive.zip" pageColorScheme="light" />);
      expect(container.querySelector('.mantine-DocViewer-root')).not.toHaveAttribute(
        'data-page-color-scheme'
      );
    });
  });
});
