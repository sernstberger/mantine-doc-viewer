import { getImageKeyAction } from './image-zoom';
import { getPresentationTarget } from './geometry';

/** What a key pressed in the PDF body does */
export type PdfKeyAction =
  | { type: 'page'; page: number }
  | { type: 'exit' }
  | { type: 'zoom-in' }
  | { type: 'zoom-out' }
  | { type: 'fit' }
  | { type: 'search' };

interface PdfKeyEvent {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

interface PdfKeyState {
  /** A document is loaded */
  ready: boolean;
  presenting: boolean;
  /** A search bar is mounted, so Ctrl+F has somewhere to go */
  searchAvailable: boolean;
  currentPage: number;
  numPages: number;
}

function getPresentationAction(event: PdfKeyEvent, state: PdfKeyState): PdfKeyAction | null {
  const target = state.presenting
    ? getPresentationTarget(event.key, state.currentPage, state.numPages)
    : null;
  if (target === null) {
    return null;
  }
  return target === 'exit' ? { type: 'exit' } : { type: 'page', page: target };
}

/** + = - 0 zoom like images do; rotation stays on its button, as r is common in screen readers */
function getZoomAction(event: PdfKeyEvent): PdfKeyAction | null {
  const action = getImageKeyAction(event);
  return action && action !== 'rotate' ? { type: action } : null;
}

const isFind = (event: PdfKeyEvent) =>
  !!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f';

/** Action for a key pressed in the PDF body, or null when the viewer leaves the key alone */
export function getPdfKeyAction(event: PdfKeyEvent, state: PdfKeyState): PdfKeyAction | null {
  const presentation = getPresentationAction(event, state);
  if (presentation || !state.ready) {
    return presentation;
  }
  return (
    getZoomAction(event) ?? (state.searchAvailable && isFind(event) ? { type: 'search' } : null)
  );
}
