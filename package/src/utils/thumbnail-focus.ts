/**
 * The viewer whose sidebar thumbnail has focus, or null when focus is elsewhere. Read before an
 * edit from the sidebar reloads the document, which removes the thumbnails for a moment
 */
export function getFocusedThumbnailViewer(): Element | null {
  const thumbnail = document.activeElement?.closest('[role="listbox"] [role="option"]');
  return thumbnail?.closest('[data-doc-type]') ?? null;
}

/** Focuses a page's thumbnail in the sidebar of `viewer` (from getFocusedThumbnailViewer) */
export function focusThumbnail(viewer: Element | null, page: number) {
  viewer
    ?.querySelector<HTMLElement>(`[role="listbox"] [role="option"][data-page-number="${page}"]`)
    ?.focus();
}
