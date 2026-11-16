import { act, render as rtlRender, renderHook, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { render } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import * as pdfjs from 'pdfjs-dist';
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useState,
} from 'react';
import { TestDocViewer } from '../../../../test-utils/viewer';
import { DocViewerProvider } from '../../doc-viewer.context';
import { createDocViewerStore } from '../../doc-viewer.store';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { installIntersectionObserver } from '../../../../test-utils/intersection-observer';
import { PdfPage } from '../../DocViewerPages/PdfPage';
import { createPageScaleStore } from './use-page-scale';
import { PdfThumbnails } from '../../DocViewerThumbnails/PdfThumbnails';
import { useAnnouncement } from '../../hooks/pdf/use-announcement';
import { useCurrentPage } from '../../hooks/pdf/use-current-page';
import { useNearViewport } from '../../hooks/pdf/use-near-viewport';
import { usePagePreview } from '../../hooks/pdf/use-page-preview';
import { usePresentation } from '../../hooks/pdf/use-presentation';
import { usePdfSearchBar } from '../../hooks/pdf/use-pdf-search-bar';
import { useReleasePage } from '../../hooks/pdf/use-release-page';
import { useZoomAnchor } from '../../hooks/pdf/use-zoom-anchor';

let io: ReturnType<typeof installIntersectionObserver> | null = null;

afterEach(() => {
  io?.uninstall();
  io = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function box(top: number, bottom: number, left = 0, right = 100) {
  return { top, bottom, left, right, width: right - left, height: bottom - top } as DOMRect;
}

function pageNode(rect: DOMRect, offsetTop = 0, offsetLeft = 0) {
  const node = document.createElement('div');
  node.getBoundingClientRect = () => rect;
  Object.defineProperty(node, 'offsetTop', { value: offsetTop });
  Object.defineProperty(node, 'offsetLeft', { value: offsetLeft });
  return node;
}

function defineOn(target: object, props: Record<string, unknown>) {
  Object.entries(props).forEach(([key, value]) =>
    Object.defineProperty(target, key, { configurable: true, get: value as () => unknown })
  );
  return () => Object.keys(props).forEach((key) => delete (target as any)[key]);
}

describe('useCurrentPage', () => {
  function setup(horizontal = false) {
    io = installIntersectionObserver();
    const root = document.createElement('div');
    root.getBoundingClientRect = () => box(0, 100);
    document.body.append(root);
    const nodes = [
      pageNode(box(0, 80), 0),
      pageNode(box(60, 160), 200, 300),
      pageNode(box(500, 600), 5000, 9000),
    ];
    nodes.forEach((node, index) => (node.dataset.pageNumber = String(index + 1)));
    const hook = renderHook(({ root: r }) => useCurrentPage(r, horizontal), {
      initialProps: { root: root as HTMLElement | null },
    });
    nodes.forEach((node, index) => act(() => hook.result.current.registerPage(index + 1, node)));
    return { root, nodes, hook };
  }

  afterEach(() => document.body.replaceChildren());

  it('does nothing without a scroll root or IntersectionObserver', () => {
    const { result } = renderHook(() => useCurrentPage(null));
    act(() => result.current.registerPage(1, document.createElement('div')));
    act(() => result.current.scrollToPage(2));
    expect(result.current.currentPage).toBe(2);

    // No IntersectionObserver installed: only scrolling works
    const root = document.createElement('div');
    const { result: second } = renderHook(() => useCurrentPage(root));
    expect(second.current.currentPage).toBe(1);
  });

  it('observes pages registered before the scroll root exists', () => {
    io = installIntersectionObserver();
    const node = pageNode(box(0, 50));
    node.dataset.pageNumber = '1';
    const root = document.createElement('div');
    root.getBoundingClientRect = () => box(0, 100);
    const { result, rerender } = renderHook(({ r }) => useCurrentPage(r), {
      initialProps: { r: null as HTMLElement | null },
    });
    act(() => result.current.registerPage(1, node));
    rerender({ r: root });
    expect(io.observers[0].elements.has(node)).toBe(true);
  });

  it('picks the most visible page and drops pages that leave the view', () => {
    const { nodes, hook } = setup();
    act(() => io!.setIntersecting(nodes[0], true));
    expect(hook.result.current.currentPage).toBe(1);
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(1);
    act(() => io!.setIntersecting(nodes[0], false));
    expect(hook.result.current.currentPage).toBe(2);
    // Nothing visible: stays on the last page
    act(() => io!.setIntersecting(nodes[1], false));
    expect(hook.result.current.currentPage).toBe(2);
  });

  it('ignores a page that was unregistered while it was still reported visible', () => {
    const { nodes, hook } = setup();
    act(() => hook.result.current.registerPage(1, null));
    act(() => io!.setIntersecting(nodes[0], true));
    expect(hook.result.current.currentPage).toBe(1);
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(2);
  });

  it('replaces the node of a page and stops watching the old one', () => {
    const { nodes, hook } = setup();
    const replacement = pageNode(box(0, 90));
    replacement.dataset.pageNumber = '1';
    act(() => hook.result.current.registerPage(1, replacement));
    expect(io!.observers[0].elements.has(nodes[0])).toBe(false);
    expect(io!.observers[0].elements.has(replacement)).toBe(true);
  });

  it('updates on scroll, once per frame', () => {
    const { root, nodes, hook } = setup();
    act(() => io!.setIntersecting(nodes[0], true));
    const frames: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    nodes[0].getBoundingClientRect = () => box(-200, -100);
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(2);
    nodes[1].getBoundingClientRect = () => box(-500, -400);
    nodes[0].getBoundingClientRect = () => box(10, 90);
    act(() => {
      root.dispatchEvent(new Event('scroll'));
      root.dispatchEvent(new Event('scroll'));
    });
    expect(cancel).toHaveBeenCalled();
    act(() => frames[frames.length - 1](0));
    expect(hook.result.current.currentPage).toBe(1);
    hook.unmount();
    root.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(2);
  });

  it('scrolls to a page and ignores the pages passed on the way until scrollend', () => {
    const { root, nodes, hook } = setup();
    const scrollTo = jest.spyOn(root, 'scrollTo').mockImplementation(() => {});
    defineOn(root, { clientHeight: () => 1000, clientWidth: () => 1000 });
    act(() => hook.result.current.scrollToPage(2, 20));
    expect(hook.result.current.currentPage).toBe(2);
    // Vertical only: keeps the horizontal position
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 208, left: 0, behavior: 'smooth' });

    act(() => io!.setIntersecting(nodes[0], true));
    expect(hook.result.current.currentPage).toBe(2);
    act(() => {
      root.dispatchEvent(new Event('scrollend'));
    });
    act(() => io!.setIntersecting(nodes[1], false));
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(1);
  });

  it('jumps instantly over long distances and scrolls sideways when horizontal', () => {
    const { root, hook } = setup(true);
    const scrollTo = jest.spyOn(root, 'scrollTo').mockImplementation(() => {});
    defineOn(root, { clientHeight: () => 100, clientWidth: () => 5000 });
    act(() => hook.result.current.scrollToPage(3));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 4988, left: 8988, behavior: 'auto' });

    defineOn(root, { clientHeight: () => 5000, clientWidth: () => 1 });
    act(() => hook.result.current.scrollToPage(2));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 188, left: 288, behavior: 'auto' });
  });

  it('settles a scroll that never ends on a timeout, and one that is replaced', () => {
    jest.useFakeTimers();
    const { root, nodes, hook } = setup();
    jest.spyOn(root, 'scrollTo').mockImplementation(() => {});
    defineOn(root, { clientHeight: () => 1000, clientWidth: () => 1000 });
    act(() => hook.result.current.scrollToPage(2));
    act(() => hook.result.current.scrollToPage(1));
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(1);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => io!.setIntersecting(nodes[1], false));
    act(() => io!.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(2);
  });

  it('settles a scroll in progress when it unmounts', () => {
    jest.useFakeTimers();
    const { root, hook } = setup();
    jest.spyOn(root, 'scrollTo').mockImplementation(() => {});
    act(() => hook.result.current.scrollToPage(2));
    const clear = jest.spyOn(window, 'clearTimeout');
    hook.unmount();
    expect(clear).toHaveBeenCalled();
  });

  it('only changes the page for a page that is not registered', () => {
    const { hook } = setup();
    act(() => hook.result.current.scrollToPage(9));
    expect(hook.result.current.currentPage).toBe(9);
  });
});

describe('useNearViewport', () => {
  function Probe({ root }: { root: HTMLElement | null }) {
    const { ref, near } = useNearViewport<HTMLDivElement>(root);
    return <div ref={ref} data-testid="probe" data-near={near} />;
  }

  it('turns near and far as the element moves in and out of range', () => {
    io = installIntersectionObserver();
    rtlRender(<Probe root={null} />);
    const probe = screen.getByTestId('probe');
    expect(probe).toHaveAttribute('data-near', 'false');
    expect(io.observers[0].options?.rootMargin).toBe('200% 0px');
    act(() => io!.setIntersecting(probe, true));
    expect(probe).toHaveAttribute('data-near', 'true');
    act(() => io!.setIntersecting(probe, false));
    expect(probe).toHaveAttribute('data-near', 'false');
  });

  it('counts as near where IntersectionObserver is missing', () => {
    rtlRender(<Probe root={null} />);
    expect(screen.getByTestId('probe')).toHaveAttribute('data-near', 'true');
  });

  it('does nothing while the ref is not attached', () => {
    io = installIntersectionObserver();
    const { result } = renderHook(() => useNearViewport(null));
    expect(result.current.near).toBe(false);
    expect(io.observers).toHaveLength(0);
  });
});

describe('useReleasePage', () => {
  const makeDocument = (getPage?: jest.Mock) => {
    const cleanup = jest.fn();
    return {
      cleanup,
      doc: {
        getPage: getPage ?? jest.fn(() => Promise.resolve({ cleanup })),
      } as any,
    };
  };

  it('releases a page that was drawn once it is no longer near', async () => {
    const { doc, cleanup } = makeDocument();
    const { rerender } = renderHook(({ near }) => useReleasePage(doc, 2, near), {
      initialProps: { near: false },
    });
    rerender({ near: false });
    expect(doc.getPage).not.toHaveBeenCalled();
    rerender({ near: true });
    rerender({ near: false });
    await act(async () => {});
    expect(doc.getPage).toHaveBeenCalledWith(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
    // Released once: unmounting does not clean up again
    rerender({ near: false });
  });

  it('releases a drawn page when it unmounts, and never one that was not drawn', async () => {
    const drawn = makeDocument();
    renderHook(() => useReleasePage(drawn.doc, 1, true)).unmount();
    await act(async () => {});
    expect(drawn.cleanup).toHaveBeenCalledTimes(1);

    const idle = makeDocument();
    renderHook(() => useReleasePage(idle.doc, 1, false)).unmount();
    expect(idle.doc.getPage).not.toHaveBeenCalled();
  });

  it('ignores a page that fails to clean up', async () => {
    const { doc } = makeDocument(jest.fn(() => Promise.reject(new Error('gone'))));
    renderHook(() => useReleasePage(doc, 1, true)).unmount();
    await act(async () => {});
    expect(doc.getPage).toHaveBeenCalled();
  });
});

describe('usePresentation', () => {
  const restore: (() => void)[] = [];
  const setDocument = (props: Record<string, unknown>) => restore.push(defineOn(document, props));

  afterEach(() => {
    restore.splice(0).forEach((fn) => fn());
  });

  const store = createDocViewerStore();
  const setup = (toggle: jest.Mock, fullscreen = false, body: HTMLElement | null = null) => {
    store.setState({ ...store.getState(), presenting: false });
    return renderHook((props) => usePresentation(props), {
      initialProps: { store, fullscreen, toggleFullscreen: toggle, body },
    });
  };

  it('presents inside the viewer where full screen is not available', async () => {
    const toggle = jest.fn(() => Promise.resolve());
    const { result } = setup(toggle);
    await act(() => result.current.toggle());
    expect(result.current.presenting).toBe(true);
    await act(() => result.current.toggle());
    expect(result.current.presenting).toBe(false);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('does not ask for full screen when the viewer is already full screen', async () => {
    setDocument({ fullscreenEnabled: () => true });
    const toggle = jest.fn(() => Promise.resolve());
    const { result } = setup(toggle, true);
    await act(() => result.current.start());
    expect(toggle).not.toHaveBeenCalled();
    expect(result.current.presenting).toBe(true);
  });

  it('enters full screen, leaves it when stopped, and focuses the body', async () => {
    setDocument({ fullscreenEnabled: () => true, fullscreenElement: () => document.body });
    const toggle = jest.fn(() => Promise.resolve());
    const body = document.createElement('div');
    body.tabIndex = -1;
    document.body.append(body);
    const { result } = setup(toggle, false, body);
    await act(() => result.current.start());
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(body).toHaveFocus();
    await act(() => result.current.stop());
    expect(toggle).toHaveBeenCalledTimes(2);
    expect(result.current.presenting).toBe(false);
    // Not in full screen from the presentation any more: stop leaves it alone
    await act(() => result.current.stop());
    expect(toggle).toHaveBeenCalledTimes(2);
    body.remove();
  });

  it('stays in the viewer when full screen is refused', async () => {
    setDocument({ fullscreenEnabled: () => true });
    const toggle = jest.fn(() => Promise.reject(new Error('denied')));
    const { result } = setup(toggle);
    await act(() => result.current.start());
    expect(result.current.presenting).toBe(true);
    await act(() => result.current.stop());
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('skips leaving full screen when the browser already left it, and ignores a failure', async () => {
    setDocument({ fullscreenEnabled: () => true });
    const toggle = jest.fn(() => Promise.resolve());
    const { result } = setup(toggle);
    await act(() => result.current.start());
    await act(() => result.current.stop());
    expect(toggle).toHaveBeenCalledTimes(1);

    setDocument({ fullscreenElement: () => document.body });
    toggle.mockImplementationOnce(() => Promise.resolve());
    await act(() => result.current.start());
    toggle.mockImplementationOnce(() => Promise.reject(new Error('failed')));
    await act(() => result.current.stop());
    expect(result.current.presenting).toBe(false);
  });

  it('ends the presentation when full screen ends', async () => {
    setDocument({ fullscreenEnabled: () => true });
    const toggle = jest.fn(() => Promise.resolve());
    const { result, rerender } = setup(toggle);
    await act(() => result.current.start());
    rerender({ store, fullscreen: true, toggleFullscreen: toggle, body: null });
    expect(result.current.presenting).toBe(true);
    rerender({ store, fullscreen: false, toggleFullscreen: toggle, body: null });
    expect(result.current.presenting).toBe(false);
  });
});

describe('useAnnouncement', () => {
  it('alternates an invisible character so repeated text changes', () => {
    const { result } = renderHook(() => useAnnouncement());
    act(() => result.current[1]('Page 2'));
    const first = result.current[0];
    act(() => result.current[1]('Page 2'));
    expect(result.current[0]).not.toBe(first);
    expect(result.current[0].replace('​', '')).toBe('Page 2');
  });
});

describe('useZoomAnchor', () => {
  // Pages 400px tall at scale 1 with a gap that does not scale, like a kiosk's 100vh row gap
  function pagesWithGap(gap: number, view = { width: 400, height: 600 }) {
    const state = { scale: 1 };
    const root = document.createElement('div');
    defineOn(root, { clientHeight: () => view.height, clientWidth: () => view.width });
    const empty = document.createElement('div');
    empty.dataset.pageNumber = '0';
    root.append(empty);
    [1, 2, 3].forEach((number) => {
      const node = document.createElement('div');
      node.dataset.pageNumber = String(number);
      defineOn(node, {
        offsetTop: () => (number - 1) * (400 * state.scale + gap),
        offsetLeft: () => 0,
        offsetHeight: () => 400 * state.scale,
        offsetWidth: () => 300 * state.scale,
      });
      root.append(node);
    });
    return { root, state };
  }

  it('keeps the same spot of the same page in the middle when the gaps do not scale', () => {
    const { root, state } = pagesWithGap(1000);
    // Middle of the view (scrollTop + 300) a quarter of the way down page 2, which starts at 1400
    root.scrollTop = 1400 + 100 - 300;
    const { rerender } = renderHook(
      ({ scale }) => {
        // Like React, the pages get their new size when the render is committed
        useLayoutEffect(() => {
          state.scale = scale;
        }, [scale]);
        useZoomAnchor(root, scale, true);
      },
      { initialProps: { scale: 1 } }
    );
    rerender({ scale: 0.5 });
    // Page 2 now starts at 200 + 1000 and is 200 tall: a quarter down is 1250, the middle of the view
    expect(root.scrollTop).toBe(1250 - 300);
  });

  it('stays at the start when the view shows the top of the first page', () => {
    // The first fit when a document opens must not scroll into page 1
    const { root, state } = pagesWithGap(1000);
    root.scrollTop = 0;
    const { rerender } = renderHook(
      ({ scale }) => {
        useLayoutEffect(() => {
          state.scale = scale;
        }, [scale]);
        useZoomAnchor(root, scale, true);
      },
      { initialProps: { scale: 1 } }
    );
    rerender({ scale: 1.85 });
    expect(root.scrollTop).toBe(0);
  });

  it('anchors to the nearest page when the middle of the view is in a gap', () => {
    const { root, state } = pagesWithGap(1000);
    // Middle at 500, in the gap 100px below page 1 (which ends at 400)
    root.scrollTop = 200;
    const { rerender } = renderHook(
      ({ scale }) => {
        // Like React, the pages get their new size when the render is committed
        useLayoutEffect(() => {
          state.scale = scale;
        }, [scale]);
        useZoomAnchor(root, scale, true);
      },
      { initialProps: { scale: 1 } }
    );
    rerender({ scale: 2 });
    // Page 1 is 800 tall: 1.25 of it is 1000, put in the middle of the view
    expect(root.scrollTop).toBe(1000 - 300);
  });

  /** In a right-to-left scroller the page boxes and `scrollLeft` count from 0 at the right edge, down to negative numbers */
  function rightToLeftPage(state: { scale: number }) {
    const root = document.createElement('div');
    root.style.direction = 'rtl';
    defineOn(root, { clientHeight: () => 600, clientWidth: () => 400 });
    const page = document.createElement('div');
    page.dataset.pageNumber = '1';
    defineOn(page, {
      offsetTop: () => 0,
      offsetLeft: () => -300 * state.scale,
      offsetHeight: () => 400 * state.scale,
      offsetWidth: () => 300 * state.scale,
    });
    root.append(page);
    return root;
  }

  function zoomTo(root: HTMLElement, state: { scale: number }, scale: number) {
    const { rerender } = renderHook(
      ({ value }) => {
        useLayoutEffect(() => {
          state.scale = value;
        }, [value]);
        useZoomAnchor(root, value, true);
      },
      { initialProps: { value: 1 } }
    );
    rerender({ value: scale });
  }

  it('keeps the same spot of the page in the middle in a right-to-left view', () => {
    const state = { scale: 1 };
    const root = rightToLeftPage(state);
    root.scrollTop = 100;
    root.scrollLeft = -250;
    zoomTo(root, state, 2);
    expect(root.scrollLeft).toBe(-300);
  });

  it('stays at the start in a right-to-left view that shows the right edge of the first page', () => {
    const state = { scale: 1 };
    const root = rightToLeftPage(state);
    root.scrollTop = 0;
    root.scrollLeft = 0;
    zoomTo(root, state, 2);
    expect(root.scrollLeft).toBe(0);
  });

  it('leaves the offset when there is no page to keep in view', () => {
    const root = document.createElement('div');
    const restore = defineOn(root, { clientHeight: () => 600, clientWidth: () => 400 });
    root.scrollTop = 1000;
    const { rerender } = renderHook(({ scale, enabled }) => useZoomAnchor(root, scale, enabled), {
      initialProps: { scale: 1, enabled: true },
    });
    rerender({ scale: 1, enabled: true });
    rerender({ scale: 2, enabled: false });
    rerender({ scale: 4, enabled: true });
    restore();
    expect(root.scrollTop).toBe(1000);

    const { rerender: other } = renderHook(({ r }) => useZoomAnchor(r, 1, true), {
      initialProps: { r: null as HTMLElement | null },
    });
    other({ r: null });
  });
});

function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    getStyles: (name: string, options?: { style?: CSSProperties }) => ({
      className: name,
      style: options?.style,
    }),
    labels: {
      thumbnailLabel: (n: number) => `Thumbnail ${n}`,
      pagesLabel: 'Pages',
      pageOfLabel: (n: number, total: number) => `Page ${n} of ${total}`,
    },
    ...overrides,
  } as any;
}

function withContext(overrides?: Record<string, unknown>) {
  return ({ children }: { children: ReactNode }) => (
    <MantineProvider env="test">
      <DocViewerProvider value={makeContext(overrides)}>{children}</DocViewerProvider>
    </MantineProvider>
  );
}

async function loadDocument(numPages = 12) {
  getDocument.mockReset();
  const { page } = mockPdf({ numPages });
  const doc = (await (getDocument as any)({}).promise) as any;
  return { doc, page };
}

describe('usePagePreview', () => {
  it('draws nothing while far, and skips a page whose canvas is gone', async () => {
    const { doc, page } = await loadDocument(2);
    const { result, rerender, unmount } = renderHook(
      ({ near }) =>
        usePagePreview({ document: doc, pageNumber: 1, width: 100, near, rotation: 90 }),
      { wrapper: withContext(), initialProps: { near: false } }
    );
    rerender({ near: true });
    // No canvas is attached by renderHook
    await act(async () => {});
    expect(page.render).not.toHaveBeenCalled();
    expect(result.current.size).toBeNull();
    unmount();
  });

  it('draws with layers and ignores a render that fails', async () => {
    const { doc, page } = await loadDocument(2);
    page.render.mockImplementation(() => ({
      promise: Promise.reject(new Error('x')),
      cancel: jest.fn(),
    }));
    const layers = { config: {}, version: 1 } as any;
    function Preview({ near }: { near: boolean }) {
      const { canvasRef, size } = usePagePreview({
        document: doc,
        pageNumber: 1,
        width: 100,
        near,
        layers,
      });
      return <canvas ref={canvasRef} data-size={size ? size.width : ''} />;
    }
    const { container, rerender } = rtlRender(<Preview near />, { wrapper: withContext() });
    await act(async () => {});
    expect(page.render).toHaveBeenCalledWith(
      expect.objectContaining({ optionalContentConfigPromise: expect.anything() })
    );
    expect(container.querySelector('canvas')).toHaveAttribute('data-size', '612');
    rerender(<Preview near={false} />);
  });
});

describe('PdfThumbnails', () => {
  const restore: (() => void)[] = [];
  afterEach(() => restore.splice(0).forEach((fn) => fn()));

  function layout(sign = 1) {
    restore.push(
      defineOn(HTMLElement.prototype, {
        offsetTop: function (this: HTMLElement) {
          return Number(this.dataset.pageNumber ?? 0) * 100;
        },
        offsetLeft: function (this: HTMLElement) {
          const page = Number(this.dataset.pageNumber ?? 0);
          return sign > 0 ? page * 100 : 250 - page * 100;
        },
        offsetHeight: () => 100,
        offsetWidth: () => 100,
        clientHeight: () => 250,
        clientWidth: () => 250,
      })
    );
  }

  const placeholder = { width: 612, height: 792 };

  async function setup(
    props: Partial<ComponentProps<typeof PdfThumbnails>> = {},
    scrollTo = jest.spyOn(Element.prototype, 'scrollTo')
  ) {
    const { doc } = await loadDocument();
    const onSelect = jest.fn();
    const utils = rtlRender(
      <PdfThumbnails
        document={doc}
        placeholderSize={placeholder}
        currentPage={1}
        rotation={0}
        orientation="vertical"
        onSelect={onSelect}
        {...props}
      />,
      { wrapper: withContext() }
    );
    await act(async () => {});
    return { ...utils, doc, onSelect, scrollTo };
  }

  it('keeps the active thumbnail in view, vertically', async () => {
    layout();
    const { scrollTo, rerender, doc, onSelect } = await setup();
    // Page 1 spans 100 to 200 inside a view of 0 to 250
    expect(scrollTo).not.toHaveBeenCalled();
    const again = (currentPage: number) =>
      rerender(
        <PdfThumbnails
          document={doc}
          placeholderSize={placeholder}
          currentPage={currentPage}
          rotation={90}
          orientation="vertical"
          onSelect={onSelect}
        />
      );
    again(5);
    await act(async () => {});
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 500 - 125 + 50 });
    // Above the view
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get: () => 900,
    });
    restore.push(() => delete (HTMLElement.prototype as any).scrollTop);
    again(2);
    await act(async () => {});
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 200 - 125 + 50 });
  });

  it('keeps the active thumbnail in view, horizontally', async () => {
    layout();
    const { scrollTo, rerender, doc, onSelect } = await setup({ orientation: 'horizontal' });
    expect(scrollTo).not.toHaveBeenCalled();
    rerender(
      <PdfThumbnails
        document={doc}
        placeholderSize={placeholder}
        currentPage={6}
        rotation={0}
        orientation="horizontal"
        onSelect={onSelect}
      />
    );
    await act(async () => {});
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 600 - 125 + 50 });
  });

  it('keeps the active thumbnail in view in a right-to-left rail, where offsets are negative', async () => {
    layout(-1);
    const { scrollTo, rerender, doc, onSelect } = await setup({ orientation: 'horizontal' });
    const rail = screen.getByRole('listbox', { name: 'Pages' });
    rail.style.direction = 'rtl';
    expect(scrollTo).not.toHaveBeenCalled();
    rerender(
      <PdfThumbnails
        document={doc}
        placeholderSize={placeholder}
        currentPage={6}
        rotation={0}
        orientation="horizontal"
        onSelect={onSelect}
      />
    );
    await act(async () => {});
    expect(scrollTo).toHaveBeenLastCalledWith({ left: -350 - 125 + 50 });
  });

  it('moves with the arrow, page, home and end keys and focuses the thumbnail', async () => {
    layout();
    const { onSelect } = await setup({ currentPage: 5 });
    const option = screen.getByRole('option', { name: 'Thumbnail 5' });
    option.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(onSelect).toHaveBeenLastCalledWith(6);
    expect(screen.getByRole('option', { name: 'Thumbnail 6' })).toHaveFocus();
    // 250 / 100 = 2 thumbnails fit
    await userEvent.keyboard('{PageDown}');
    expect(onSelect).toHaveBeenLastCalledWith(8);
    await userEvent.keyboard('{End}');
    expect(onSelect).toHaveBeenLastCalledWith(12);
    await userEvent.keyboard('{ArrowDown}');
    expect(onSelect).toHaveBeenLastCalledWith(12);
    await userEvent.keyboard('{Home}');
    expect(onSelect).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard('{ArrowUp}');
    expect(onSelect).toHaveBeenLastCalledWith(1);
  });

  it('uses the width of the rail when horizontal', async () => {
    layout();
    const { onSelect } = await setup({ currentPage: 5, orientation: 'horizontal' });
    screen.getByRole('option', { name: 'Thumbnail 5' }).focus();
    await userEvent.keyboard('{PageUp}');
    expect(onSelect).toHaveBeenLastCalledWith(3);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });

  it('moves one thumbnail per Page key where the rail has no size', async () => {
    const { onSelect } = await setup({ currentPage: 5 });
    screen.getByRole('option', { name: 'Thumbnail 5' }).focus();
    await userEvent.keyboard('{PageDown}');
    expect(onSelect).toHaveBeenLastCalledWith(6);
  });

  it('selects on Enter and space, and ignores other keys and keys outside a thumbnail', async () => {
    layout();
    const { onSelect } = await setup({ currentPage: 3 });
    const option = screen.getByRole('option', { name: 'Thumbnail 3' });
    option.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(3);
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
    await userEvent.keyboard('a');
    expect(onSelect).toHaveBeenCalledTimes(2);

    onSelect.mockClear();
    const listbox = screen.getByRole('listbox', { name: 'Pages' });
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selects a thumbnail on click, at half size when horizontal', async () => {
    const { onSelect, container } = await setup({ orientation: 'horizontal', width: 100 });
    await userEvent.click(screen.getByRole('option', { name: 'Thumbnail 2' }));
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(container.querySelector('.thumbnailImage')).toHaveStyle({ width: '50px' });
  });

  it('draws only the thumbnails near the rail', async () => {
    io = installIntersectionObserver();
    const { container } = await setup();
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
    act(() => io!.setIntersecting(screen.getByRole('option', { name: 'Thumbnail 1' }), true));
    await act(async () => {});
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
  });
});

function PdfPageForTest({
  doc,
  onTextLayer,
  textLayer,
  linkService,
}: {
  doc: any;
  onTextLayer: (page: number, divs: HTMLElement[] | null) => void;
  textLayer?: unknown;
  linkService?: any;
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [scaleStore] = useState(() => createPageScaleStore(1));
  return (
    <div ref={setRoot}>
      <PdfPage
        pdfjs={{ ...pdfjs, TextLayer: textLayer ?? (pdfjs as any).TextLayer } as any}
        document={doc}
        pageNumber={1}
        numPages={2}
        scaleStore={scaleStore}
        placeholderSize={{ width: 612, height: 792 }}
        scrollRoot={root}
        registerPage={() => {}}
        linkService={linkService}
        onTextLayer={onTextLayer}
      />
    </div>
  );
}

describe('PdfPage', () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  }

  it('ignores a page that loads after it was removed or whose render fails', async () => {
    const { doc, page } = await loadDocument(2);
    const late = deferred<unknown>();
    const realPage = await doc.getPage(1);
    const getPage = jest.spyOn(doc, 'getPage');
    getPage.mockImplementation(() => late.promise as any);
    const onTextLayer = jest.fn();
    const view = rtlRender(<PdfPageForTest doc={doc} onTextLayer={onTextLayer} />, {
      wrapper: withContext(),
    });
    view.unmount();
    late.resolve(realPage);
    await act(async () => {});
    expect(page.render).not.toHaveBeenCalled();
  });

  it('ignores a page that cannot be loaded for its links', async () => {
    const { doc } = await loadDocument(2);
    const page = await doc.getPage(1);
    page.getAnnotations.mockImplementation(() => Promise.reject(new Error('gone')));
    rtlRender(<PdfPageForTest doc={doc} onTextLayer={jest.fn()} linkService={{}} />, {
      wrapper: withContext(),
    });
    await act(async () => {});
    expect(page.getAnnotations).toHaveBeenCalled();
  });

  it('ignores a render that fails and a text layer that is cancelled while rendering', async () => {
    const { doc, page } = await loadDocument(2);
    page.render.mockImplementation(() => ({
      promise: Promise.reject(new Error('x')),
      cancel: jest.fn(),
    }));
    const slow = deferred<void>();
    const onTextLayer = jest.fn();
    class SlowTextLayer extends (pdfjs as any).TextLayer {
      render() {
        return slow.promise;
      }
    }
    const view = rtlRender(
      <PdfPageForTest doc={doc} onTextLayer={onTextLayer} textLayer={SlowTextLayer} />,
      { wrapper: withContext() }
    );
    await act(async () => {});
    view.unmount();
    slow.resolve();
    await act(async () => {});
    expect(onTextLayer).not.toHaveBeenCalledWith(1, expect.any(Array));
  });

  const links = [
    { id: 'web', annotationType: 2, url: 'https://mantine.dev/' },
    { id: 'titled', annotationType: 2, url: 'https://example.com/' },
    { id: 'page', annotationType: 2, dest: [2, { name: 'Fit' }] },
    { id: 'unknown', annotationType: 2, dest: 'nowhere' },
    { id: 'broken', annotationType: 2, dest: 'broken' },
    { id: 'plain', annotationType: 2, action: 'NextPage' },
    { id: 'labelled', annotationType: 2, url: 'https://labelled.test/' },
    { id: 'missing', annotationType: 2, url: 'https://missing.test/' },
  ];

  it('does not name links of a page that was removed while its links were drawn', async () => {
    mockPdf({ links });
    const doc = (await (getDocument as any)({}).promise) as any;
    const slow = deferred<void>();
    jest
      .spyOn(pdfjs.AnnotationLayer.prototype as any, 'render')
      .mockImplementation(() => slow.promise);
    const view = rtlRender(<PdfPageForTest doc={doc} onTextLayer={jest.fn()} linkService={{}} />, {
      wrapper: withContext(),
    });
    await act(async () => {});
    view.unmount();
    slow.resolve();
    await act(async () => {});
    expect(pdfjs.AnnotationLayer.prototype.render).toHaveBeenCalled();
  });

  it('names links after their address, title or target page', async () => {
    mockPdf({ links });
    const original = pdfjs.AnnotationLayer.prototype.render;
    jest.spyOn(pdfjs.AnnotationLayer.prototype as any, 'render').mockImplementation(async function (
      this: any,
      ...args: any[]
    ) {
      await original.apply(this, args as any);
      const find = (id: string) =>
        document.querySelector<HTMLAnchorElement>(`a[data-element-id="${id}"]`)!;
      find('titled').title = 'Example title';
      find('labelled').setAttribute('aria-label', 'Already named');
      find('missing').remove();
    });
    getDocument.mockImplementationOnce(
      (
        (impl) =>
        (...args: unknown[]) => {
          const task = impl(...args);
          task.promise = task.promise.then((doc: any) => {
            doc.getDestination.mockImplementation((name: string) =>
              name === 'broken' ? Promise.reject(new Error('bad')) : Promise.resolve(null)
            );
            return doc;
          });
          return task;
        }
      )(getDocument.getMockImplementation()!)
    );

    render(<TestDocViewer src="/files/report.pdf" />);
    expect(await screen.findByRole('link', { name: 'https://mantine.dev/' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Example title' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Already named' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'https://missing.test/' })).not.toBeInTheDocument();
    expect(document.querySelector('a[data-element-id="unknown"]')).not.toHaveAttribute(
      'aria-label'
    );
    expect(document.querySelector('a[data-element-id="broken"]')).not.toHaveAttribute('aria-label');
    expect(document.querySelector('a[data-element-id="plain"]')).not.toHaveAttribute('aria-label');
  });

  it('marks the text layer as selecting from pointer down until pointer up', async () => {
    mockPdf();
    render(<TestDocViewer src="/files/report.pdf" />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    const layer = document.querySelector('.mantine-DocViewer-textLayer')!;
    act(() => {
      layer.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(layer).toHaveClass('selecting');
    act(() => {
      window.dispatchEvent(new Event('pointerup'));
    });
    expect(layer).not.toHaveClass('selecting');
  });
});

describe('usePdfSearchBar', () => {
  it('closes without a search button or a fallback to focus', async () => {
    const store = createDocViewerStore();
    const { result } = renderHook(() => usePdfSearchBar(store, null, null));
    act(() => result.current.open('total'));
    expect(store.getState().searchOpened).toBe(true);
    act(() => result.current.close());
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(store.getState().searchOpened).toBe(false);
    expect(result.current.query).toBe('');
  });
});
