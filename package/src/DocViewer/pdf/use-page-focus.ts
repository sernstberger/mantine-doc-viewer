import { clamp } from '@mantine/hooks';
import { useState } from 'react';
import type { PageOrder } from './page-edits';

/** Which page of the list has the keyboard focus (the roving tab stop), and moving it */
export function usePageFocus(scrollRoot: HTMLElement | null, order: PageOrder) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  /** Moves DOM focus to the page at this index of `pages`, without changing the tab stop */
  const focusElement = (index: number, pages: PageOrder) => {
    scrollRoot?.querySelector<HTMLElement>(`[data-page="${pages[index]}"]`)?.focus();
  };

  /** Focus the page at this index of `pages` (the order on screen once a change has rendered) */
  const focusIndex = (index: number, pages: PageOrder = order) => {
    const next = clamp(index, 0, pages.length - 1);
    setFocusedIndex(next);
    focusElement(next, pages);
  };

  /**
   * After the order changes to `pages`: the tab stop moves to `index` now, so a key pressed before
   * the next frame acts on the right page, and DOM focus follows once `pages` is on screen
   */
  const refocus = (index: number, pages: PageOrder) => {
    const next = clamp(index, 0, pages.length - 1);
    setFocusedIndex(next);
    requestAnimationFrame(() => focusElement(next, pages));
  };

  return { focusedIndex, setFocusedIndex, focusIndex, refocus };
}
