import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, renderHook } from '@testing-library/react';
import React from 'react';
import { DocViewer } from './DocViewer';
import { getNextPage, useIdleTimeout } from './kiosk';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

afterEach(() => jest.useRealTimers());

describe('getNextPage', () => {
  it('goes one page on, and loops or stops at the end', () => {
    expect(getNextPage(1, 3, 'single', true)).toBe(2);
    expect(getNextPage(3, 3, 'single', true)).toBe(1);
    expect(getNextPage(3, 3, 'wrapped', false)).toBeNull();
  });

  it('turns two-page layouts a spread at a time', () => {
    expect(getNextPage(1, 6, 'two-page', true)).toBe(3);
    expect(getNextPage(2, 6, 'two-page', true)).toBe(3);
    expect(getNextPage(5, 6, 'two-page', true)).toBe(1);

    // With a cover the spreads are 1, 2-3, 4-5
    expect(getNextPage(1, 6, 'two-page-cover', true)).toBe(2);
    expect(getNextPage(2, 6, 'two-page-cover', true)).toBe(4);
    expect(getNextPage(3, 6, 'two-page-cover', true)).toBe(4);
    expect(getNextPage(6, 6, 'two-page-cover', false)).toBeNull();
  });
});

describe('useIdleTimeout', () => {
  it('is idle after the timeout, calls onIdle, and wakes at the next touch', () => {
    jest.useFakeTimers();
    const onIdle = jest.fn();
    const { result } = renderHook(() => useIdleTimeout(1000, onIdle));
    expect(result.current).toBe(false);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(true);
    expect(onIdle).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.pointerDown(document.body);
    });
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1000));
    expect(onIdle).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a timeout, with or without onIdle', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useIdleTimeout(undefined, undefined));
    act(() => jest.advanceTimersByTime(10 ** 7));
    expect(result.current).toBe(false);

    const withHandler = renderHook(() => useIdleTimeout(500, undefined));
    act(() => jest.advanceTimersByTime(500));
    expect(withHandler.result.current).toBe(true);
  });

  it('listens to activity only while a timeout is set', () => {
    const listen = jest.spyOn(document, 'addEventListener');
    const listened = () => listen.mock.calls.filter(([event]) => event === 'mousemove').length;
    const { rerender, result } = renderHook(({ timeout }) => useIdleTimeout(timeout, undefined), {
      initialProps: { timeout: undefined as number | undefined },
    });
    expect(listened()).toBe(0);
    rerender({ timeout: 1000 });
    expect(listened()).toBe(1);
    rerender({ timeout: undefined });
    expect(result.current).toBe(false);
    listen.mockRestore();
  });
});

describe('idleTimeout, onIdle and autoAdvance', () => {
  beforeEach(() => getDocument.mockReset());

  /** Loads with real timers, then turns on the props that start timers, under fake ones */
  async function setup(props: Record<string, unknown>) {
    mockPdf();
    const onPageChange = jest.fn();
    function Harness() {
      const [on, setOn] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOn(true)}>
            Start
          </button>
          <DocViewer
            src="/files/report.pdf"
            pdfWorkerSrc="/worker.mjs"
            onPageChange={onPageChange}
            {...(on ? props : {})}
          />
        </>
      );
    }
    render(<Harness />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    jest.useFakeTimers();
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Start' })));
    return onPageChange;
  }

  it('plays all the time without idleTimeout, and loops', async () => {
    const onPageChange = await setup({ autoAdvance: { interval: 1000 } });
    act(() => jest.advanceTimersByTime(1000));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    act(() => jest.advanceTimersByTime(1000));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    act(() => jest.advanceTimersByTime(1000));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('stops at the last page without loop', async () => {
    const onPageChange = await setup({ autoAdvance: { interval: 1000, loop: false } });
    for (let second = 0; second < 5; second += 1) {
      act(() => jest.advanceTimersByTime(1000));
    }
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(onPageChange).toHaveBeenCalledTimes(3);
  });

  it('plays only while idle, and stops at the next touch', async () => {
    const onIdle = jest.fn();
    const onPageChange = await setup({
      idleTimeout: 5000,
      onIdle,
      autoAdvance: { interval: 1000 },
    });
    act(() => jest.advanceTimersByTime(4000));
    expect(onIdle).not.toHaveBeenCalled();
    expect(onPageChange).not.toHaveBeenCalledWith(2);

    act(() => jest.advanceTimersByTime(1000));
    expect(onIdle).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    act(() => {
      fireEvent.pointerDown(document.body);
    });
    act(() => jest.advanceTimersByTime(3000));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });
});
