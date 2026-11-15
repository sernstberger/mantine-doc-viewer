import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import {
  type DocViewerController,
  DocViewer,
  type DocViewerProps,
} from '../../../test-utils/render-legacy';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

const VIEW = { width: 1200, height: 900 };

/** Reports every observed element at the size of the view, so fitted scales and swipes work */
class SizedResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(target: Element) {
    const box = { inlineSize: VIEW.width, blockSize: VIEW.height };
    this.callback(
      [{ target, borderBoxSize: [box], contentRect: { x: 0, y: 0, ...VIEW } } as never],
      this as never
    );
  }

  unobserve() {}

  disconnect() {}
}

const pages = () => screen.findAllByRole('group', { name: /^Page \d of 5$/ });
const body = () => screen.getByRole('region');
const indicator = (page: number) => `${page} / 5`;

function renderViewer(props: Partial<DocViewerProps> = {}) {
  const controller = createRef<DocViewerController>();
  const onPageChange = jest.fn();
  const onSpreadChange = jest.fn();
  const view = render(
    <DocViewer
      src="/files/book.pdf"
      pdfWorkerSrc="/worker.mjs"
      defaultPageLayout="two-page-cover"
      controllerRef={controller}
      onPageChange={onPageChange}
      onSpreadChange={onSpreadChange}
      {...props}
    />
  );
  return { ...view, controller, onPageChange, onSpreadChange };
}

describe('spreads', () => {
  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: 5 });
  });

  it('goes to spreads and turns them through the controller', async () => {
    const { controller, onSpreadChange } = renderViewer();
    // Nothing to go to while the document loads
    act(() => controller.current!.goToSpread(2));
    await pages();
    expect(onSpreadChange).toHaveBeenLastCalledWith(1, [1]);

    act(() => controller.current!.goToSpread(2));
    expect(screen.getByText(indicator(2))).toBeInTheDocument();
    expect(onSpreadChange).toHaveBeenLastCalledWith(2, [2, 3]);

    act(() => controller.current!.nextSpread());
    expect(screen.getByText(indicator(4))).toBeInTheDocument();
    expect(onSpreadChange).toHaveBeenLastCalledWith(3, [4, 5]);

    // The last spread has no next one
    act(() => controller.current!.nextSpread());
    expect(screen.getByText(indicator(4))).toBeInTheDocument();

    act(() => controller.current!.previousSpread());
    expect(screen.getByText(indicator(2))).toBeInTheDocument();
    act(() => controller.current!.goToSpread(40));
    expect(screen.getByText(indicator(4))).toBeInTheDocument();
  });

  it('reports the spread again when the layout pairs pages differently', async () => {
    const { controller, onSpreadChange } = renderViewer();
    await pages();

    act(() => controller.current!.setPageLayout('two-page'));
    expect(onSpreadChange).toHaveBeenLastCalledWith(1, [1, 2]);
    act(() => controller.current!.setPageLayout('single'));
    expect(onSpreadChange).toHaveBeenLastCalledWith(1, [1]);
    act(() => controller.current!.nextSpread());
    expect(screen.getByText(indicator(2))).toBeInTheDocument();
  });

  it('snaps scrolling to pages, sideways in the horizontal layout', async () => {
    const { controller } = renderViewer({ withScrollSnap: true });
    await pages();

    expect(body()).toHaveAttribute('data-scroll-snap', 'y');
    act(() => controller.current!.setPageLayout('horizontal'));
    expect(body()).toHaveAttribute('data-scroll-snap', 'x');
    act(() => controller.current!.togglePresentation());
    expect(body()).not.toHaveAttribute('data-scroll-snap');
  });

  it('does not snap or turn by default', async () => {
    renderViewer();
    await pages();

    expect(body()).not.toHaveAttribute('data-scroll-snap');
    expect(body()).toHaveAttribute('aria-keyshortcuts', 'Control+F Meta+F Plus Minus 0');
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByText(indicator(1))).toBeInTheDocument();
  });
});

describe('withPageTurning', () => {
  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: 5 });
  });

  describe('keys', () => {
    it('turns with the arrow and page keys from anywhere on the page', async () => {
      renderViewer({ withPageTurning: true });
      // Nothing turns while the document loads
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      await pages();
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
      expect(body()).toHaveAttribute(
        'aria-keyshortcuts',
        'Control+F Meta+F Plus Minus 0 ArrowLeft ArrowRight PageUp PageDown'
      );

      expect(fireEvent.keyDown(document.body, { key: 'ArrowRight' })).toBe(false);
      expect(screen.getByText(indicator(2))).toBeInTheDocument();
      fireEvent.keyDown(document.body, { key: 'PageDown' });
      expect(screen.getByText(indicator(4))).toBeInTheDocument();
      fireEvent.keyDown(document.body, { key: 'PageUp' });
      expect(screen.getByText(indicator(2))).toBeInTheDocument();
      // Other keys keep their default
      expect(fireEvent.keyDown(document.body, { key: 'ArrowDown' })).toBe(true);
    });

    it('leaves keys alone when keys are turned off', async () => {
      renderViewer({ withPageTurning: { keys: false } });
      await pages();

      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });

    it('lets a presentation handle the keys itself', async () => {
      const { controller } = renderViewer({ withPageTurning: true });
      await pages();

      act(() => controller.current!.togglePresentation());
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
  });

  describe('tap zones', () => {
    const atEdges = () =>
      jest.spyOn(body(), 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
      } as DOMRect);

    it('turns back from the left edge and forward from the right edge', async () => {
      renderViewer({ withPageTurning: true });
      await pages();
      atEdges();

      fireEvent.click(body(), { clientX: 900 });
      expect(screen.getByText(indicator(2))).toBeInTheDocument();
      fireEvent.click(body(), { clientX: 500 });
      expect(screen.getByText(indicator(2))).toBeInTheDocument();
      fireEvent.click(body(), { clientX: 50 });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });

    it('leaves clicks on controls in pages and on selected text alone', async () => {
      renderViewer({
        withPageTurning: true,
        renderPageOverlay: ({ pageNumber }) => <button type="button">Pin {pageNumber}</button>,
      });
      await pages();
      atEdges();

      fireEvent.click(await screen.findByRole('button', { name: 'Pin 1' }), { clientX: 900 });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();

      const selection = jest
        .spyOn(window, 'getSelection')
        .mockReturnValue({ isCollapsed: false } as Selection);
      fireEvent.click(body(), { clientX: 900 });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
      selection.mockRestore();
    });

    it('does nothing while loading or when tap zones are turned off', async () => {
      const { unmount } = renderViewer({ withPageTurning: true });
      fireEvent.click(document.querySelector('.mantine-DocViewer-body')!, { clientX: 900 });
      await pages();
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
      unmount();

      renderViewer({ withPageTurning: { tapZones: false } });
      await pages();
      atEdges();
      fireEvent.click(body(), { clientX: 900 });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });
  });

  describe('swipe', () => {
    const OriginalResizeObserver = window.ResizeObserver;
    beforeEach(() => {
      window.ResizeObserver = SizedResizeObserver as never;
    });
    afterEach(() => {
      window.ResizeObserver = OriginalResizeObserver;
    });

    const swipe = (
      target: Element,
      to: number,
      { pointerType = 'touch', end = 'pointerUp' as 'pointerUp' | 'pointerCancel' } = {}
    ) => {
      fireEvent.pointerDown(target, { pointerType, pointerId: 1, button: 0, clientX: 600 });
      fireEvent.pointerMove(document, { pointerType, pointerId: 1, clientX: (600 + to) / 2 });
      fireEvent[end](document, { pointerType, pointerId: 1, clientX: to });
    };

    it('turns forward for a swipe to the left and back for a swipe to the right', async () => {
      renderViewer({ withPageTurning: true, defaultZoom: 'fit-page' });
      await pages();
      await waitFor(() => expect(body()).toHaveAttribute('data-swipe'));

      swipe(body(), 400);
      expect(screen.getByText(indicator(2))).toBeInTheDocument();
      // The click that ends the swipe is not a tap
      fireEvent.click(body(), { clientX: 1100 });
      expect(screen.getByText(indicator(2))).toBeInTheDocument();

      swipe(body(), 800);
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });

    it('ignores short swipes, interrupted swipes and mouse drags', async () => {
      renderViewer({ withPageTurning: true, defaultZoom: 'fit-page' });
      await pages();
      await waitFor(() => expect(body()).toHaveAttribute('data-swipe'));

      swipe(body(), 580);
      swipe(body(), 400, { end: 'pointerCancel' });
      swipe(body(), 400, { pointerType: 'mouse' });
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });

    it('scrolls instead when pages do not fit across the view', async () => {
      const { controller } = renderViewer({ withPageTurning: true, defaultZoom: 'fit-page' });
      await pages();
      act(() => controller.current!.setPageLayout('horizontal'));
      await waitFor(() => expect(body()).not.toHaveAttribute('data-swipe'));

      swipe(body(), 400);
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });

    it('does not take swipes when swipe is turned off', async () => {
      renderViewer({ withPageTurning: { swipe: false }, defaultZoom: 'fit-page' });
      await pages();

      expect(body()).not.toHaveAttribute('data-swipe');
      swipe(body(), 400);
      expect(screen.getByText(indicator(1))).toBeInTheDocument();
    });
  });
});

describe('page layout', () => {
  const { matchMedia } = window;

  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: 5 });
  });

  afterEach(() => {
    window.matchMedia = matchMedia;
  });

  /** Makes min-width queries up to the given width in em match, as Mantine's useMatches asks */
  function viewport(em: number) {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: Number(/min-width: ([\d.]+)em/.exec(query)?.[1] ?? Infinity) <= em,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  }

  const layoutOf = () => body().querySelector('[data-layout]')?.getAttribute('data-layout');

  it('takes a responsive default, until the reader picks a layout', async () => {
    viewport(30);
    const onPageLayoutChange = jest.fn();
    const { controller } = renderViewer({
      defaultPageLayout: { base: 'single', sm: 'two-page-cover' },
      onPageLayoutChange,
    });
    await pages();
    expect(layoutOf()).toBe('single');

    act(() => controller.current!.setPageLayout('wrapped'));
    expect(layoutOf()).toBe('wrapped');
    expect(onPageLayoutChange).toHaveBeenLastCalledWith('wrapped');
  });

  it('uses the larger breakpoint on wide screens', async () => {
    viewport(64);
    renderViewer({ defaultPageLayout: { base: 'single', sm: 'two-page-cover' } });
    await pages();
    expect(layoutOf()).toBe('two-page-cover');
  });

  it('follows a controlled layout and reports what the reader picks', async () => {
    const onPageLayoutChange = jest.fn();
    const { controller, rerender } = renderViewer({ pageLayout: 'single', onPageLayoutChange });
    await pages();

    act(() => controller.current!.setPageLayout('two-page'));
    expect(onPageLayoutChange).toHaveBeenLastCalledWith('two-page');
    // Controlled: nothing changes until the app passes the new layout
    expect(layoutOf()).toBe('single');
    // Picking the layout that is shown reports nothing
    onPageLayoutChange.mockClear();
    act(() => controller.current!.setPageLayout('single'));
    expect(onPageLayoutChange).not.toHaveBeenCalled();

    rerender(
      <DocViewer
        src="/files/book.pdf"
        pdfWorkerSrc="/worker.mjs"
        pageLayout="two-page"
        onPageLayoutChange={onPageLayoutChange}
      />
    );
    await pages();
    expect(layoutOf()).toBe('two-page');
  });

  it('keeps the current page in view when the layout changes', async () => {
    const scrollTo = jest.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
    const { controller } = renderViewer({ defaultPageLayout: 'single' });
    await pages();
    act(() => controller.current!.goToPage(3));
    scrollTo.mockClear();

    act(() => controller.current!.setPageLayout('two-page'));
    expect(screen.getByText(indicator(3))).toBeInTheDocument();
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'instant' }));
    scrollTo.mockRestore();
  });
});

describe('withScroll', () => {
  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: 5 });
  });

  it('stops reader scrolling, and the controller still moves the view', async () => {
    const { controller } = renderViewer({ withScroll: false });
    await pages();
    expect(body()).toHaveAttribute('data-no-scroll');

    act(() => controller.current!.goToPage(4));
    expect(screen.getByText(indicator(4))).toBeInTheDocument();
  });

  it('lets readers scroll by default', async () => {
    renderViewer();
    await pages();
    expect(body()).not.toHaveAttribute('data-no-scroll');
  });
});
