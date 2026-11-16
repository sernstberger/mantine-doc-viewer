import type { DocViewerPageLayout } from '../doc-viewer.types';

interface BodyAttributesInput {
  presenting: boolean;
  layout: DocViewerPageLayout;
  /** `withScrollSnap`: scrolling stops at pages */
  scrollSnap: boolean | undefined;
  /** `withScroll`: false when the app turns the pages itself */
  scroll: boolean | undefined;
  /** Pages fit across the view, so a sideways swipe turns them */
  swipeable: boolean;
  /** Page turning listens to the arrow and Page keys */
  turningKeys: boolean;
  /** A search bar is mounted, so the find shortcut is listed */
  searchAvailable: boolean;
}

/**
 * The keys the PDF scroll area answers to, and the data attributes its CSS reads. A presentation
 * has its own keys and scrolling, so none of the reading modes apply during one
 */
export function getBodyAttributes({
  presenting,
  layout,
  scrollSnap,
  scroll,
  swipeable,
  turningKeys,
  searchAvailable,
}: BodyAttributesInput) {
  const reading = !presenting;
  return {
    keyShortcuts: [
      searchAvailable && 'Control+F Meta+F',
      'Plus Minus 0',
      turningKeys && 'ArrowLeft ArrowRight PageUp PageDown',
    ]
      .filter(Boolean)
      .join(' '),
    'data-scroll-snap': reading && scrollSnap ? (layout === 'horizontal' ? 'x' : 'y') : undefined,
    'data-no-scroll': (reading && scroll === false) || undefined,
    'data-swipe': (reading && swipeable) || undefined,
  };
}
