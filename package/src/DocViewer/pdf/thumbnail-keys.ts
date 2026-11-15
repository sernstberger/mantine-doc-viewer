import { clamp } from '@mantine/hooks';

/** How many thumbnails fit in the rail, at least one */
export function getThumbnailsPerView(railSize: number, thumbnailSize: number) {
  return Math.max(1, Math.floor(railSize / (thumbnailSize || 1)));
}

/** Page a listbox key moves to from `page`, kept within the document, or null for other keys */
export function getNextThumbnailPage(
  key: string,
  page: number,
  numPages: number,
  perView: number
): number | null {
  const moves: Record<string, number> = {
    ArrowDown: page + 1,
    ArrowRight: page + 1,
    ArrowUp: page - 1,
    ArrowLeft: page - 1,
    PageDown: page + perView,
    PageUp: page - perView,
    Home: 1,
    End: numPages,
  };
  return key in moves ? clamp(moves[key], 1, numPages) : null;
}
