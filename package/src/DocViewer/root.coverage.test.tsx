import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import * as api from '../index';
import { getRegionProps, softDisabled } from './a11y';
import type { DocViewerController } from './controller';
import { DocViewerBody, useDocViewer, DocViewerRenderer } from './renderers';
import { detectDocType, getCodeLanguage } from './detect-doc-type';
import { DocViewer } from './DocViewer';
import { DocViewerToolbar } from './DocViewerToolbar';
import { useDocViewerContext } from './DocViewer.context';
import * as icons from './icons';
import { DEFAULT_LABELS } from './labels';
import { getScrollBehavior, prefersReducedMotion } from './scroll';
import { DOC_VIEWER_SIZES } from './sizes';
import { TextStatus } from './text/TextStatus';
import { formatFileSize } from './text/use-text-document';
import { DocViewerLoading, DocViewerMessage } from './views/MessageView';
import { UnsupportedView } from './views/UnsupportedView';
import { clampZoom, MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from './zoom';
import { ZoomControls } from './ZoomControls';

/** Renders content inside a DocViewer by way of a custom renderer */
function renderIn(
  content: React.ReactNode,
  props: Partial<React.ComponentProps<typeof DocViewer>> = {}
) {
  const renderer: DocViewerRenderer = { test: () => true, render: () => content };
  return render(<DocViewer src="/files/doc.bin" renderers={[renderer]} {...props} />);
}

describe('index', () => {
  it('exports the public api', () => {
    expect(api.DocViewer).toBe(DocViewer);
    expect(api.detectDocType).toBe(detectDocType);
    expect(api.DOC_VIEWER_DEFAULT_LABELS).toBe(DEFAULT_LABELS);
    expect(api.DocViewerToolbar).toBe(DocViewerToolbar);
    expect(api.DocViewerTooltip).toBeDefined();
    expect(api.DocViewerLoading).toBe(DocViewerLoading);
    expect(api.DocViewerMessage).toBe(DocViewerMessage);
    expect(api.DocViewerBody).toBe(DocViewerBody);
    expect(api.useDocViewer).toBe(useDocViewer);
    expect(api.useTextDocument).toBeDefined();
  });
});

describe('labels', () => {
  it('formats every default label function', () => {
    const l = DEFAULT_LABELS;
    expect(l.selectedCount(3)).toBe('3 selected');
    expect(l.editorPage(2, 3, 4)).toBe('Page 2, position 3 of 4');
    expect(l.pageMoved(2, 3)).toBe('Page 2 moved to position 3');
    expect(l.pagesRemoved(1)).toBe('1 page removed');
    expect(l.pagesRemoved(3)).toBe('3 pages removed');
    expect(l.downloadAttachment('a.txt')).toBe('Download attachment a.txt');
    expect(l.pageOf(1, 5)).toBe('Page 1 of 5');
    expect(l.thumbnail(2)).toBe('Page 2');
    expect(l.linkToPage(4)).toBe('Go to page 4');
    expect(l.matchOf(1, 2)).toBe('1 of 2');
    expect(l.matchOnPage(1, 2, 3)).toBe('Match 1 of 2, page 3');
    expect(l.tooLarge('3 MB')).toBe('This file is too large to preview (3 MB)');
    expect(l.notSupportedYet('pdf')).toBe('Preview for pdf files is not available yet');
  });
});

describe('icons', () => {
  it('renders every icon as a hidden svg and passes props on', () => {
    Object.values(icons).forEach((Icon) => {
      const { container, unmount } = render(<Icon data-testid="icon" />);
      const svg = container.querySelector('svg')!;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('data-testid', 'icon');
      unmount();
    });
  });
});

describe('small helpers', () => {
  it('detects languages and types', () => {
    expect(getCodeLanguage({ src: '/a/b.py' })).toBe('python');
    expect(getCodeLanguage({ src: 'blob:x', fileName: 'x.ts' })).toBe('ts');
    expect(getCodeLanguage({ src: 'blob:x' })).toBeUndefined();
    expect(detectDocType({ mimeType: 'text/plain' })).toBe('text');
    expect(detectDocType({ mimeType: 'application/x-weird', src: 'a.pdf' })).toBe('pdf');
    expect(detectDocType({ src: 'data:image/png;base64,AAAA' })).toBe('image');
    expect(detectDocType({ src: 'data:application/x-weird,1', fileName: 'a.md' })).toBe('markdown');
    expect(detectDocType({ src: '/a.json' })).toBe('code');
    expect(detectDocType({ src: '/a.csv' })).toBe('text');
    expect(detectDocType({ src: '/a.zip' })).toBe('unknown');
    expect(detectDocType({ mimeType: 'text/markdown' })).toBe('markdown');
    expect(detectDocType({ mimeType: 'application/json' })).toBe('code');
    expect(detectDocType({})).toBe('unknown');
  });

  it('handles zoom steps', () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(zoomIn(1)).toBe(1.25);
    expect(zoomIn(MAX_ZOOM)).toBe(MAX_ZOOM);
    expect(zoomOut(1)).toBe(0.75);
    expect(zoomOut(MIN_ZOOM)).toBe(MIN_ZOOM);
  });

  it('reads reduced motion', () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn(() => ({ matches: true })) as any;
    expect(prefersReducedMotion()).toBe(true);
    expect(getScrollBehavior()).toBe('auto');
    window.matchMedia = jest.fn(() => ({ matches: false })) as any;
    expect(getScrollBehavior()).toBe('smooth');
    (window as any).matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });

  it('has a size config for each size', () => {
    expect(Object.keys(DOC_VIEWER_SIZES)).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  it('builds accessibility props', () => {
    const onClick = jest.fn();
    const enabled = softDisabled(false, onClick);
    expect(enabled['aria-disabled']).toBeUndefined();
    enabled.onClick();
    expect(onClick).toHaveBeenCalledTimes(1);
    const disabled = softDisabled(true, onClick);
    expect(disabled['aria-disabled']).toBe(true);
    disabled.onClick();
    expect(onClick).toHaveBeenCalledTimes(1);

    expect(getRegionProps(false, 'Doc')).toEqual({});
    expect(getRegionProps(true, 'Doc', 'Space')).toEqual({
      tabIndex: 0,
      role: 'region',
      'aria-label': 'Doc',
      'aria-keyshortcuts': 'Space',
    });
  });
});

describe('DocViewer root', () => {
  it('fills pdf viewer props and data attributes', () => {
    const { container } = render(
      <DocViewer
        src="data:image/png;base64,AAAA"
        pageColorScheme="dark"
        size="lg"
        color="red"
        matchColor="blue"
        activeMatchColor="green"
        pageGap="xl"
        pageBackground="gray"
        thumbnailWidth={0}
      />
    );
    const root = container.querySelector('[data-doc-type]')!;
    expect(root).toHaveAttribute('data-page-color-scheme', 'dark');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root.getAttribute('style')).toContain('--doc-viewer-match-color');
  });

  it('omits the color scheme attribute for light pages and data-size for css sizes', () => {
    const { container } = render(
      <DocViewer src="/a.png" pageColorScheme="light" size={'5rem' as any} />
    );
    const root = container.querySelector('[data-doc-type]')!;
    expect(root).not.toHaveAttribute('data-page-color-scheme');
    expect(root).not.toHaveAttribute('data-size');
  });

  it('shows the unsupported view for a type with no view yet', () => {
    render(<DocViewer src="/a.zip" />);
    expect(screen.getByText('Preview is not available for this file type')).toBeInTheDocument();
  });

  it('uses file names from encoded urls and none for data or blob urls', () => {
    const first = renderIn(<DocViewerToolbar />, { src: '/files/my%20doc.bin?x=1#y' });
    expect(screen.getByText('my doc.bin')).toBeInTheDocument();
    first.unmount();
    const second = renderIn(<DocViewerToolbar />, { src: 'blob:abc' });
    expect(screen.getByText('Document')).toBeInTheDocument();
    second.unmount();
    renderIn(<DocViewerToolbar />, { src: '/files/' });
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('exposes the controller: download, fullscreen and the no-op actions', async () => {
    const ref = React.createRef<DocViewerController>();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { rerender } = renderIn(null, {
      controllerRef: ref,
      src: '/files/doc.bin',
      fileName: undefined,
    });
    ref.current!.download();
    expect(click.mock.contexts[0]).toMatchObject({ download: 'doc.bin', target: '_blank' });
    click.mockRestore();

    // Does nothing without a view that implements it
    ref.current!.goToPage(2);
    ref.current!.setZoom(1);
    ref.current!.zoomIn();
    ref.current!.zoomOut();
    ref.current!.rotate();
    ref.current!.openSearch();
    ref.current!.closeSearch();
    ref.current!.toggleThumbnails();
    ref.current!.togglePresentation();
    ref.current!.editPages();
    ref.current!.setPageLayout('single');
    await ref.current!.print();
    await expect(ref.current!.getOutline()).resolves.toEqual([]);

    await ref.current!.toggleFullscreen();

    // Without a file name the download has an empty name
    const link = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    rerender(
      <DocViewer
        src="blob:x"
        renderers={[{ test: () => true, render: () => null }]}
        controllerRef={ref}
      />
    );
    ref.current!.download();
    expect(link.mock.contexts[0]).toMatchObject({ download: '' });
    link.mockRestore();
  });

  it('calls actions that views register, with the latest props', async () => {
    const goToPage = jest.fn();
    const getOutline = jest.fn(async () => [{ title: 'A', page: 1, url: null, items: [] }]);
    const print = jest.fn(async () => {});
    function View() {
      const { controller } = useDocViewer();
      controller.current.goToPage = goToPage;
      controller.current.getOutline = getOutline;
      controller.current.print = print;
      return null;
    }
    const ref = React.createRef<DocViewerController>();
    renderIn(<View />, { controllerRef: ref });
    ref.current!.goToPage(3);
    expect(goToPage).toHaveBeenCalledWith(3);
    await expect(ref.current!.getOutline()).resolves.toHaveLength(1);
    await ref.current!.print();
    expect(print).toHaveBeenCalled();
  });

  it('forwards document events to the latest handlers', () => {
    const onDocumentLoad = jest.fn();
    function View() {
      const { events } = useDocViewer();
      events.onDocumentLoad({ type: 'image' });
      return null;
    }
    renderIn(<View />, { onDocumentLoad });
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image' });
  });

  it('throws outside a viewer', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useDocViewerContext();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('DocViewer component was not found in the tree');
    spy.mockRestore();
  });
});

describe('DocViewerBody and useDocViewer', () => {
  it('renders a focusable region, or a plain body when not focusable', () => {
    function View() {
      const { title } = useDocViewer();
      return (
        <>
          <DocViewerBody data-testid="a" className="x">
            {title}
          </DocViewerBody>
          <DocViewerBody data-testid="b" focusable={false} />
        </>
      );
    }
    renderIn(<View />, { fileName: 'doc.bin' });
    expect(screen.getByTestId('a')).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('a')).toHaveAttribute('aria-label', 'doc.bin');
    expect(screen.getByTestId('b')).not.toHaveAttribute('role');
  });
});

describe('DocViewerToolbar', () => {
  const originalFullscreen = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled');

  afterEach(() => {
    if (originalFullscreen) {
      Object.defineProperty(document, 'fullscreenEnabled', originalFullscreen);
    } else {
      delete (document as any).fullscreenEnabled;
    }
  });

  it('hides the title when toolbarControls turns it off', () => {
    renderIn(<DocViewerToolbar />, { fileName: 'doc.bin', toolbarControls: { title: false } });
    expect(screen.queryByText('doc.bin')).not.toBeInTheDocument();
  });

  it('renders nothing when the toolbar is off', () => {
    renderIn(<DocViewerToolbar />, { withToolbar: false });
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('shows download, children and the section, and hides what is turned off', () => {
    renderIn(
      <DocViewerToolbar>
        <span>child</span>
      </DocViewerToolbar>,
      { toolbarSection: <span>section</span>, withDownload: false }
    );
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.getByText('section')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('shows the download link without a file name as a plain download', () => {
    renderIn(<DocViewerToolbar />, { src: 'blob:abc' });
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download', '');
  });

  it('toggles full screen when the browser supports it', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    renderIn(<DocViewerToolbar />);
    const button = await screen.findByRole('button', { name: 'Full screen' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
  });

  it('shows the exit label while in full screen', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    renderIn(<DocViewerToolbar />);
    const button = await screen.findByRole('button', { name: 'Full screen' });
    const root = document.querySelector('[data-doc-type]')!;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: root });
    fireEvent(root, new Event('fullscreenchange'));
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    delete (document as any).fullscreenElement;
  });

  it('prints through onPrint, ignoring clicks while printing', async () => {
    let finish!: () => void;
    const onPrint = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    renderIn(<DocViewerToolbar onPrint={onPrint} />);
    const button = screen.getByRole('button', { name: 'Print' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onPrint).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(button).not.toHaveAttribute('data-loading'));
  });

  it('opens the file in a new tab when printing fails', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderIn(
      <DocViewerToolbar
        onPrint={() => {
          throw new Error('no');
        }}
      />,
      { src: '/files/doc.bin' }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith('/files/doc.bin', '_blank', 'noopener,noreferrer')
    );
    open.mockRestore();
  });

  it('has no print button without onPrint or when withPrint is off', () => {
    const first = renderIn(<DocViewerToolbar />);
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
    first.unmount();
    renderIn(<DocViewerToolbar onPrint={() => {}} />, { withPrint: false });
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
  });
});

describe('ZoomControls', () => {
  function zoom(scale: number, fitted = false) {
    const onZoom = jest.fn();
    const onFit = jest.fn();
    renderIn(
      <ZoomControls
        scale={scale}
        fitted={fitted}
        fitLabel="Fit"
        fitIcon={<span />}
        onZoom={onZoom}
        onFit={onFit}
      />
    );
    return { onZoom, onFit };
  }

  it('zooms in, out, resets and fits', () => {
    const { onZoom, onFit } = zoom(1, true);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoom).toHaveBeenLastCalledWith(1.25);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoom).toHaveBeenLastCalledWith(0.75);
    fireEvent.click(screen.getByRole('button', { name: '100%, Reset zoom to 100%' }));
    expect(onZoom).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Fit' }));
    expect(onFit).toHaveBeenCalled();
  });

  it('does not zoom past the limits', () => {
    const { onZoom } = zoom(MAX_ZOOM);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoom).not.toHaveBeenCalled();
  });

  it('does not zoom out past the minimum', () => {
    const { onZoom } = zoom(MIN_ZOOM);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoom).not.toHaveBeenCalled();
  });
});

describe('messages and unsupported view', () => {
  it('announces errors as alerts and others as status, with an optional download link', () => {
    renderIn(
      <>
        <DocViewerMessage error withDownload>
          broken
        </DocViewerMessage>
        <DocViewerMessage>plain</DocViewerMessage>
        <DocViewerLoading />
      </>,
      { fileName: 'doc.bin' }
    );
    expect(screen.getByRole('alert')).toHaveTextContent('broken');
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'download',
      'doc.bin'
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
  });

  it('download link has a plain download without a file name', () => {
    renderIn(<DocViewerMessage withDownload>x</DocViewerMessage>, { src: 'blob:abc' });
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute('download', '');
  });

  it('says which type is not supported yet', () => {
    renderIn(<UnsupportedView type="pdf" />);
    expect(screen.getByText('Preview for pdf files is not available yet')).toBeInTheDocument();
  });

  it('shows the generic message for unknown types', () => {
    renderIn(<UnsupportedView type="unknown" />);
    expect(screen.getByText('Preview is not available for this file type')).toBeInTheDocument();
  });
});

describe('TextStatus', () => {
  it('shows loading, too large and error states, and nothing when ready', () => {
    const { rerender } = renderIn(<TextStatus state={{ status: 'loading' }} />);
    expect(screen.getByText('Loading document')).toBeInTheDocument();

    const states = [
      { status: 'too-large', size: 3 * 1024 * 1024 },
      { status: 'error', error: new Error('x') },
      { status: 'ready', text: 'hi', size: 2, mimeType: undefined },
    ] as const;
    const view = (state: (typeof states)[number]) => (
      <DocViewer
        src="/a.bin"
        renderers={[{ test: () => true, render: () => <TextStatus state={state} /> }]}
      />
    );
    rerender(view(states[0]));
    expect(screen.getByText('This file is too large to preview (3.0 MB)')).toBeInTheDocument();
    rerender(view(states[1]));
    expect(screen.getByText('This file could not be loaded')).toBeInTheDocument();
    rerender(view(states[2]));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('formats file sizes', () => {
    expect(formatFileSize(10)).toBe('10 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });
});

describe('size fallback', () => {
  it('falls back to the sm toolbar when size is explicitly undefined or null', () => {
    const { container } = render(<DocViewer src="/a.png" size={null as any} />);
    expect(container.querySelector('[data-doc-type]')!.getAttribute('style')).toContain(
      '--doc-viewer-toolbar-height'
    );
  });
});
