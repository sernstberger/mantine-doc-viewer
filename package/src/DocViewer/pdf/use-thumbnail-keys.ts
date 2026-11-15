import type React from 'react';
import { getNextThumbnailPage, getThumbnailsPerView } from './thumbnail-keys';

interface ThumbnailKeysInput {
  numPages: number;
  horizontal: boolean;
  onSelect: (pageNumber: number) => void;
  onDelete?: (pageNumber: number) => void;
}

/** Listbox keys, with selection following focus: moving to a thumbnail shows its page */
export function useThumbnailKeys({ numPages, horizontal, onSelect, onDelete }: ThumbnailKeysInput) {
  return (event: React.KeyboardEvent<HTMLElement>) => {
    const root = event.currentTarget;
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    const page = Number(option?.dataset.pageNumber);
    if (!page) {
      return;
    }

    // Page Up and Page Down move by the number of thumbnails that fit in the rail
    const perView = getThumbnailsPerView(
      horizontal ? root.clientWidth : root.clientHeight,
      horizontal ? option!.offsetWidth : option!.offsetHeight
    );
    const next = getNextThumbnailPage(event.key, page, numPages, perView);

    if (next === null) {
      if (onDelete && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        onDelete(page);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(page);
      }
      return;
    }

    event.preventDefault();
    onSelect(next);
    root.querySelector<HTMLElement>(`[data-page-number="${next}"]`)?.focus();
  };
}
