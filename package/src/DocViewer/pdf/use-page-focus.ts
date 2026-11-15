import { clamp } from '@mantine/hooks';
import { useState } from 'react';
import type { PageOrder } from './page-edits';

/** Which page of the list has the keyboard focus (the roving tab stop), and moving it */
export function usePageFocus(scrollRoot: HTMLElement | null, order: PageOrder) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  /** Focus the page at this index of `pages` (the order on screen once a change has rendered) */
  const focusIndex = (index: number, pages: PageOrder = order) => {
    const next = clamp(index, 0, pages.length - 1);
    setFocusedIndex(next);
    scrollRoot?.querySelector<HTMLElement>(`[data-page="${pages[next]}"]`)?.focus();
  };

  return { focusedIndex, setFocusedIndex, focusIndex };
}
