import { render, screen } from '@mantine-tests/core';
import { act, renderHook } from '@testing-library/react';
import React, { createRef } from 'react';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import type { DocViewerController } from '../hooks/use-controller-registry';
import {
  getReadingPosition,
  getSeenSummary,
  getVisibleRange,
  mergeRange,
} from './reading-progress';
import { useReadingProgress } from '../hooks/pdf/use-reading-progress';

import { installIntersectionObserver } from '../../../test-utils/intersection-observer';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

const view = { top: 0, bottom: 100, left: 0, right: 200 };

describe('getVisibleRange', () => {
  it('gives the part of the page inside the view along the scroll axis', () => {
    expect(getVisibleRange({ top: -50, bottom: 50, left: 0, right: 10 }, view, false)).toEqual([
      0.5, 1,
    ]);
    expect(getVisibleRange({ top: 0, bottom: 0, left: 150, right: 250 }, view, true)).toEqual([
      0, 0.5,
    ]);
  });

  it('gives nothing for a page out of view or without size', () => {
    expect(getVisibleRange({ top: 100, bottom: 200, left: 0, right: 10 }, view, false)).toBeNull();
    expect(getVisibleRange({ top: 10, bottom: 10, left: 0, right: 10 }, view, false)).toBeNull();
  });
});

describe('mergeRange', () => {
  it('starts with what is visible', () => {
    expect(mergeRange(undefined, [0, 0.3])).toEqual([0, 0.3]);
  });

  it('joins ranges that touch or overlap', () => {
    expect(mergeRange([0, 0.3], [0.3, 0.6])).toEqual([0, 0.6]);
    expect(mergeRange([0.4, 0.8], [0.2, 0.5])).toEqual([0.2, 0.8]);
  });

  it('keeps the larger range after a jump', () => {
    expect(mergeRange([0, 0.2], [0.6, 1])).toEqual([0.6, 1]);
    expect(mergeRange([0, 0.5], [0.8, 1])).toEqual([0, 0.5]);
  });
});

describe('getReadingPosition', () => {
  it('is how far the view has scrolled, between 0 and 1', () => {
    expect(getReadingPosition(250, 1000, 500)).toBe(0.5);
    expect(getReadingPosition(900, 1000, 500)).toBe(1);
    expect(getReadingPosition(-10, 1000, 500)).toBe(0);
  });

  it('is 0 when nothing scrolls', () => {
    expect(getReadingPosition(0, 400, 500)).toBe(0);
  });
});

describe('getSeenSummary', () => {
  it('lists the fraction seen of every page and tells when the end was seen', () => {
    const ranges = new Map<number, [number, number]>([
      [1, [0, 1]],
      [3, [0.5, 0.999]],
    ]);
    expect(getSeenSummary(ranges, 3)).toEqual({ seen: [1, 0, 0.5], reachedEnd: true });
    expect(getSeenSummary(new Map([[3, [0, 0.5]]]), 3)).toEqual({
      seen: [0, 0, 0.5],
      reachedEnd: false,
    });
    expect(getSeenSummary(new Map(), 2)).toEqual({ seen: [0, 0], reachedEnd: false });
  });
});

function rect(top: number, bottom: number, left = 0, right = 100) {
  return { top, bottom, left, right, width: right - left, height: bottom - top } as DOMRect;
}

describe('onReadingProgress and onReachEnd', () => {
  let io: ReturnType<typeof installIntersectionObserver>;

  beforeEach(() => {
    getDocument.mockReset();
    io = installIntersectionObserver();
  });
  afterEach(() => io.uninstall());

  async function setup(props: Record<string, unknown> = {}) {
    mockPdf();
    const controller = createRef<DocViewerController>();
    const onReadingProgress = jest.fn();
    const onReachEnd = jest.fn();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        controllerRef={controller}
        onReadingProgress={onReadingProgress}
        onReachEnd={onReachEnd}
        {...props}
      />
    );
    const pages = await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    const root = screen.getByRole('region');
    root.getBoundingClientRect = () => rect(0, 100);
    pages.forEach((page, index) => {
      page.getBoundingClientRect = () => rect(index * 100 - 50, index * 100 + 50);
    });
    return { controller, onReadingProgress, onReachEnd, pages, root };
  }

  it('reports the fraction of each page seen, the position and the end', async () => {
    const { pages, root, onReadingProgress, onReachEnd } = await setup();
    Object.defineProperty(root, 'scrollHeight', { value: 300, configurable: true });
    Object.defineProperty(root, 'clientHeight', { value: 100, configurable: true });

    // Page 1 shows its lower half and page 2 its upper half
    await act(async () => io.setIntersecting(pages[0], true));
    expect(onReadingProgress).toHaveBeenLastCalledWith({
      seen: [0.5, 0, 0],
      position: 0,
      reachedEnd: false,
    });

    // Scrolling on: the view now holds the upper half of page 2
    pages.forEach((page, index) => {
      page.getBoundingClientRect = () => rect(index * 100 - 150, index * 100 - 50);
    });
    root.scrollTop = 100;
    await act(async () => io.setIntersecting(pages[1], true));
    expect(onReadingProgress).toHaveBeenLastCalledWith({
      seen: [0.5, 0.5, 0],
      position: 0.5,
      reachedEnd: false,
    });
    expect(onReachEnd).not.toHaveBeenCalled();

    pages.forEach((page, index) => {
      page.getBoundingClientRect = () => rect(index * 100 - 200, index * 100 - 100);
    });
    root.scrollTop = 200;
    await act(async () => io.setIntersecting(pages[2], true));
    expect(onReadingProgress).toHaveBeenLastCalledWith({
      seen: [0.5, 0.5, 1],
      position: 1,
      reachedEnd: true,
    });
    expect(onReachEnd).toHaveBeenCalledTimes(1);

    // Repeating what is already known says nothing new
    const calls = onReadingProgress.mock.calls.length;
    await act(async () => io.setIntersecting(pages[2], true));
    expect(onReadingProgress).toHaveBeenCalledTimes(calls);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
  });

  it('starts over with resetReadingProgress, and signals the end again', async () => {
    const { controller, pages, onReadingProgress, onReachEnd } = await setup();
    pages.forEach((page, index) => {
      page.getBoundingClientRect = () => rect(index * 100 - 200, index * 100 - 100);
    });
    await act(async () => io.setIntersecting(pages[2], true));
    expect(onReachEnd).toHaveBeenCalledTimes(1);

    act(() => controller.current!.resetReadingProgress());
    expect(onReadingProgress).toHaveBeenLastCalledWith({
      seen: [0, 0, 0],
      position: 0,
      reachedEnd: false,
    });

    await act(async () => io.setIntersecting(pages[2], true));
    expect(onReachEnd).toHaveBeenCalledTimes(2);
  });

  it('measures along the page row in the horizontal layout', async () => {
    const { pages, root, onReadingProgress } = await setup({ defaultPageLayout: 'horizontal' });
    pages.forEach((page, index) => {
      page.getBoundingClientRect = () => rect(0, 100, index * 100 - 50, index * 100 + 50);
    });
    root.getBoundingClientRect = () => rect(0, 100, 0, 100);
    Object.defineProperty(root, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(root, 'clientWidth', { value: 100, configurable: true });
    root.scrollLeft = 100;
    await act(async () => io.setIntersecting(pages[0], true));
    expect(onReadingProgress).toHaveBeenLastCalledWith({
      seen: [0.5, 0, 0],
      position: 0.5,
      reachedEnd: false,
    });
  });
});

describe('useReadingProgress', () => {
  it('reports nothing before there is a scroll root', () => {
    const events = { onReadingProgress: jest.fn(), onReachEnd: jest.fn() } as any;
    const { result } = renderHook(() =>
      useReadingProgress({
        scrollRoot: null,
        document: null,
        numPages: 0,
        horizontal: false,
        viewport: false,
        events,
      })
    );
    act(() => result.current.reset());
    expect(events.onReadingProgress).not.toHaveBeenCalled();
  });

  it('measures how far the window has scrolled through a viewer that grows (height="auto")', () => {
    const events = { onReadingProgress: jest.fn(), onReachEnd: jest.fn() } as any;
    const scrollRoot = document.createElement('div');
    // A 3000px tall viewer whose top is 1100px above the top of a 1000px window: 1100 / 2000
    scrollRoot.getBoundingClientRect = () => ({ top: -1100, height: 3000 }) as DOMRect;
    const innerHeight = window.innerHeight;
    window.innerHeight = 1000;
    const { result } = renderHook(() =>
      useReadingProgress({
        scrollRoot,
        document: null,
        numPages: 1,
        horizontal: false,
        viewport: true,
        events,
      })
    );
    act(() => result.current.reset());
    window.innerHeight = innerHeight;
    expect(events.onReadingProgress).toHaveBeenCalledWith(
      expect.objectContaining({ position: 0.55 })
    );
  });
});
