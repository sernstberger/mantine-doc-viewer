import { useIsomorphicEffect } from '@mantine/hooks';
import { useRef, useState } from 'react';
import type { DocViewerPageLayout } from '../../doc-viewer.types';

interface PageLayoutInput {
  /** The layout the app controls (`pageLayout`), already resolved for the screen */
  controlled: DocViewerPageLayout | undefined;
  /** The starting layout (`defaultPageLayout`), already resolved for the screen */
  defaultLayout: DocViewerPageLayout | undefined;
  onChange: (layout: DocViewerPageLayout) => void;
}

/**
 * The page layout: the one the app controls, else the one the reader picked, else the default.
 * A pick is reported to `onChange`, and only kept when the app does not control the layout
 */
export function usePageLayout({ controlled, defaultLayout, onChange }: PageLayoutInput) {
  const [picked, setPicked] = useState<DocViewerPageLayout | null>(null);
  const layout = controlled ?? picked ?? defaultLayout ?? 'single';
  const setLayout = (next: DocViewerPageLayout) => {
    if (next !== layout) {
      setPicked(next);
      onChange(next);
    }
  };
  return { layout, setLayout };
}

/** A new layout moves every page: jumps back to the page being read */
export function useKeepPageOnLayout(
  layout: DocViewerPageLayout,
  currentPage: number,
  scrollToPage: (page: number, offset: number, instant: boolean) => void
) {
  const shownLayout = useRef(layout);
  useIsomorphicEffect(() => {
    if (shownLayout.current !== layout) {
      shownLayout.current = layout;
      scrollToPage(currentPage, 0, true);
    }
  }, [layout, currentPage, scrollToPage]);
}
