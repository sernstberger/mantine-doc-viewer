import { render, screen } from '@mantine-tests/core';
import { act, renderHook } from '@testing-library/react';
import { buildPageText } from './search';
import React from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { installIntersectionObserver } from '../../../../test-utils/intersection-observer';
import { DocViewer } from '../DocViewer';
import { computeScale } from './geometry';
import { useCurrentPage } from './use-current-page';
import { scrollRangeIntoView, useSearchHighlights } from './use-search-highlights';

function box(top: number, bottom: number, left = 0, right = 100) {
  return { top, bottom, left, right, width: right - left, height: bottom - top } as DOMRect;
}

function pageNode(rect: DOMRect, offsetLeft = 0) {
  const node = document.createElement('div');
  node.getBoundingClientRect = () => rect;
  Object.defineProperty(node, 'offsetLeft', { value: offsetLeft });
  return node;
}

describe('height="auto" props', () => {
  it('marks the root, which grows with its content', () => {
    const { container } = render(<DocViewer src="/files/archive.zip" height="auto" />);
    const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;
    expect(root).toHaveAttribute('data-auto-height');
  });

  it('takes a fixed height through h, with or without the height prop', () => {
    const { container, rerender } = render(<DocViewer src="/files/archive.zip" height={320} />);
    const root = container.querySelector('.mantine-DocViewer-root') as HTMLElement;
    expect(root).not.toHaveAttribute('data-auto-height');
    rerender(<DocViewer src="/files/archive.zip" height={320} h={200} />);
    expect(root).not.toHaveAttribute('data-auto-height');
  });
});

describe('fitting without a view height', () => {
  const base = {
    zoom: 'fit-width' as const,
    bodyWidth: 832,
    bodyHeight: 632,
    columnGap: 16,
    pageWidth: 400,
    pageHeight: 300,
  };

  it('fits wrapped and horizontal pages to the width when the viewer grows to its pages', () => {
    expect(computeScale({ ...base, layout: 'wrapped' })).toBeCloseTo(600 / 300);
    expect(computeScale({ ...base, layout: 'wrapped', autoHeight: true })).toBe(2);
    expect(computeScale({ ...base, layout: 'horizontal', autoHeight: true })).toBe(2);
  });
});

describe('useCurrentPage in the window', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let scrollTo: jest.SpyInstance;

  beforeEach(() => {
    io = installIntersectionObserver();
    scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
  });

  afterEach(() => {
    io.uninstall();
    jest.restoreAllMocks();
    document.body.replaceChildren();
  });

  function setup(horizontal = false) {
    const root = document.createElement('div');
    document.body.append(root);
    const nodes = [pageNode(box(-900, -100)), pageNode(box(-20, 500), 700)];
    nodes.forEach((node, index) => (node.dataset.pageNumber = String(index + 1)));
    const hook = renderHook(() => useCurrentPage(root, horizontal, true));
    nodes.forEach((node, index) => act(() => hook.result.current.registerPage(index + 1, node)));
    return { root, nodes, hook };
  }

  it('measures pages against the window and watches it scroll', () => {
    const { nodes, hook } = setup();
    expect(io.observers[0].options?.root).toBeNull();

    act(() => io.setIntersecting(nodes[0], true));
    act(() => io.setIntersecting(nodes[1], true));
    expect(hook.result.current.currentPage).toBe(2);

    const frames: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    nodes[0].getBoundingClientRect = () => box(0, 500);
    nodes[1].getBoundingClientRect = () => box(500, 580);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    act(() => frames[frames.length - 1](0));
    expect(hook.result.current.currentPage).toBe(1);

    hook.unmount();
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);
  });

  it('scrolls the window to the top of a page, instantly over long distances', () => {
    const { nodes, hook } = setup();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 });
    nodes[1].getBoundingClientRect = () => box(300, 800);
    act(() => hook.result.current.scrollToPage(2, 20));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 408, left: 0, behavior: 'smooth' });

    act(() => {
      window.dispatchEvent(new Event('scrollend'));
    });
    nodes[1].getBoundingClientRect = () => box(9000, 9500);
    act(() => hook.result.current.scrollToPage(2));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 9088, left: 0, behavior: 'auto' });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('scrolls a row of pages sideways inside the viewer', () => {
    const { root, hook } = setup(true);
    const rootScrollTo = jest.fn();
    root.scrollTo = rootScrollTo;
    act(() => hook.result.current.scrollToPage(2));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
    expect(rootScrollTo).toHaveBeenLastCalledWith({ left: 688, behavior: 'smooth' });
  });
});

describe('scrollRangeIntoView in the window', () => {
  it('puts the range in the middle of the window', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1000 });
    const range = { getBoundingClientRect: () => box(900, 920) } as unknown as Range;
    scrollRangeIntoView(null, range);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1610, behavior: 'smooth' });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    scrollTo.mockRestore();
  });
});

describe('PDF viewer with height="auto"', () => {
  beforeEach(() => getDocument.mockReset());

  it('shows every page and follows the window instead of its own scroll area', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" height="auto" />);
    expect(await screen.findByRole('group', { name: 'Page 3 of 3' })).toBeInTheDocument();
  });

  it('fits wrapped pages to the width', async () => {
    mockPdf();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        height="auto"
        defaultPageLayout="wrapped"
      />
    );
    expect(await screen.findByRole('group', { name: 'Page 1 of 3' })).toBeInTheDocument();
  });
});

describe('search in the window', () => {
  it('scrolls the window to the active match', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const rangeRect = jest.fn(() => box(900, 920));
    Range.prototype.getBoundingClientRect = rangeRect;
    const items = [{ str: 'cat', hasEOL: false }];
    const match = { pageNumber: 1, start: 0, end: 3 };
    const { result } = renderHook(() =>
      useSearchHighlights({
        pages: [{ text: buildPageText(items), items }] as never,
        matches: [match],
        activeMatch: match,
        scrollRoot: document.createElement('div'),
        viewport: true,
        scrollToPage: jest.fn(),
      } as never)
    );
    const span = document.createElement('span');
    span.textContent = 'cat';
    document.body.append(span);
    act(() => result.current(1, [span]));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    span.remove();
    scrollTo.mockRestore();
  });
});
