import { clamp } from '@mantine/hooks';
import { type DocViewerMarkPoint, type DocViewerMarkupTool, toPagePoint } from './markup';
import { type Draft, isStrokeTool } from './markup-draft';
import type { PdfRotation } from './render-page';

/** How far an arrow key moves the keyboard cursor, in PDF points */
export const MARKUP_KEY_STEP = 10;

/** Keys the markup layer takes while a tool is picked, for `aria-keyshortcuts` */
export const MARKUP_KEY_SHORTCUTS =
  'ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Enter Space Escape';

/** What a key pressed on the markup layer does */
export type MarkupKeyAction =
  /** The cursor moved; `draft` is the mark being drawn, if any, after the move */
  | { type: 'move'; caret: DocViewerMarkPoint; draft: Draft | null }
  /** A mark starts at the cursor */
  | { type: 'start' }
  /** The mark being drawn is done */
  | { type: 'finish' }
  /** The mark being drawn is dropped */
  | { type: 'cancel' }
  /** A text box opens at the cursor */
  | { type: 'text' };

interface MarkupKeyEvent {
  key: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

interface MarkupKeyState {
  tool: DocViewerMarkupTool;

  /** The keyboard cursor, in page coordinates */
  caret: DocViewerMarkPoint;

  /** The mark being drawn, or null */
  draft: Draft | null;

  /** Page size at 100%, before the viewer's rotation */
  width: number;
  height: number;
  rotation: PdfRotation;
}

/** Screen direction of each arrow key, `[right, down]` */
const ARROWS: Record<string, DocViewerMarkPoint> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** A move on screen as a move on the page, which the viewer may show turned */
export function toPageDelta([right, down]: DocViewerMarkPoint, rotation: PdfRotation) {
  const [x0, y0] = toPagePoint(0, 0, 0, 0, 1, rotation);
  const [x1, y1] = toPagePoint(right, down, 0, 0, 1, rotation);
  return [x1 - x0, y1 - y0] as DocViewerMarkPoint;
}

/** The draft after the cursor moves: strokes gain a point, boxes move their far corner */
function extendDraft(tool: DocViewerMarkupTool, draft: Draft, caret: DocViewerMarkPoint): Draft {
  return isStrokeTool(tool) ? [...draft, caret] : [draft[0], caret];
}

function getMoveAction(
  direction: DocViewerMarkPoint,
  shiftKey: boolean,
  state: MarkupKeyState
): MarkupKeyAction {
  const { tool, caret, width, height, rotation } = state;
  const [dx, dy] = toPageDelta(direction, rotation);
  const next: DocViewerMarkPoint = [
    clamp(caret[0] + dx * MARKUP_KEY_STEP, 0, width),
    clamp(caret[1] + dy * MARKUP_KEY_STEP, 0, height),
  ];
  // Shift+arrow starts a mark at the cursor, like extending a text selection
  const startsHere = shiftKey && tool !== 'text' ? [caret] : null;
  const draft = state.draft ?? startsHere;
  return { type: 'move', caret: next, draft: draft && extendDraft(tool, draft, next) };
}

/**
 * Action for a key pressed on the markup layer, or null when the layer leaves the key alone.
 * Arrows move the cursor (and draw while a mark is started), Enter or Space starts and finishes a
 * mark or opens a text box, Escape drops the mark being drawn
 */
export function getMarkupKeyAction(
  event: MarkupKeyEvent,
  state: MarkupKeyState
): MarkupKeyAction | null {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return null;
  }
  const direction = ARROWS[event.key];
  if (direction) {
    return getMoveAction(direction, !!event.shiftKey, state);
  }
  if (event.key === 'Enter' || event.key === ' ') {
    if (state.tool === 'text') {
      return { type: 'text' };
    }
    return { type: state.draft ? 'finish' : 'start' };
  }
  return event.key === 'Escape' && state.draft ? { type: 'cancel' } : null;
}
