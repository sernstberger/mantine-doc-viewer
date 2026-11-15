import { useCallbackRef } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import type { DocViewerPageLayout } from '../DocViewerRoot/DocViewerRoot';

/** Plays a PDF page by page, for a screen nobody is using */
export interface DocViewerAutoAdvance {
  /** Time on each page, or each pair of pages in a two-page layout, in ms */
  interval: number;

  /** Determines whether the last page is followed by the first, `true` by default */
  loop?: boolean;
}

/** What counts as someone using the viewer */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'keydown',
  'mousemove',
  'pointerdown',
  'touchstart',
  'touchmove',
  'click',
  'wheel',
];

/**
 * True once nothing was touched for `timeout` ms, and false again at the next touch. Calls
 * `onIdle` each time it turns true. Always false without a timeout, and then it listens to
 * nothing: Mantine's useIdle cannot be switched off, so every viewer would reset a timer on each
 * mouse move for a feature most apps do not use
 */
export function useIdleTimeout(timeout: number | undefined, onIdle: (() => void) | undefined) {
  const [idle, setIdle] = useState(false);
  const handleIdle = useCallbackRef(() => onIdle?.());

  useEffect(() => {
    if (timeout === undefined) {
      return undefined;
    }

    let timer = window.setTimeout(() => setIdle(true), timeout);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), timeout);
    };
    ACTIVITY_EVENTS.forEach((event) => document.addEventListener(event, wake));
    return () => {
      ACTIVITY_EVENTS.forEach((event) => document.removeEventListener(event, wake));
      window.clearTimeout(timer);
      setIdle(false);
    };
  }, [timeout]);

  const enabled = timeout !== undefined;
  useEffect(() => {
    enabled && idle && handleIdle();
  }, [enabled, idle, handleIdle]);

  return enabled && idle;
}

/**
 * Page to show after `page` when playing, or null at the end of a document that does not loop.
 * Two-page layouts turn a spread at a time; with a cover the first spread is the page alone
 */
export function getNextPage(
  page: number,
  numPages: number,
  layout: DocViewerPageLayout,
  loop: boolean
) {
  let next = page + 1;
  if (layout === 'two-page') {
    next = page - ((page - 1) % 2) + 2;
  } else if (layout === 'two-page-cover') {
    next = page === 1 ? 2 : page - (page % 2) + 2;
  }
  return next <= numPages ? next : loop ? 1 : null;
}
