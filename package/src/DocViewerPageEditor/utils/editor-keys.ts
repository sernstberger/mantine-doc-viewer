export type EditorKeyAction =
  | 'move'
  | 'focus'
  | 'focusFirst'
  | 'focusLast'
  | 'toggle'
  | 'remove'
  | 'rotate'
  | 'selectAll'
  | 'escape';

/** An action to run, and for move and focus which way: -1 earlier, 1 later */
export interface EditorKey {
  action: EditorKeyAction;
  step: -1 | 1;
}

interface EditorKeyEvent {
  key: string;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
}

const earlier = (action: EditorKeyAction): EditorKey => ({ action, step: -1 });
const later = (action: EditorKeyAction): EditorKey => ({ action, step: 1 });

/** Arrow keys: [plain, with Alt] */
const ARROW_ACTIONS: Record<string, [EditorKey, EditorKey]> = {
  ArrowLeft: [earlier('focus'), earlier('move')],
  ArrowUp: [earlier('focus'), earlier('move')],
  ArrowRight: [later('focus'), later('move')],
  ArrowDown: [later('focus'), later('move')],
};

/** In a right-to-left page order the horizontal arrows swap: Right is earlier, Left is later */
const RTL_ARROW: Record<string, string> = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' };

/** Keys that act the same whatever modifier is held */
const PLAIN_ACTIONS: Record<string, EditorKey> = {
  Home: later('focusFirst'),
  End: later('focusLast'),
  ' ': later('toggle'),
  Delete: later('remove'),
  Backspace: later('remove'),
  Escape: later('escape'),
};

/** Letter keys: [action, whether Ctrl/Cmd must be held] */
const LETTER_ACTIONS: Record<string, [EditorKey, boolean]> = {
  r: [later('rotate'), false],
  a: [later('selectAll'), true],
};

/** Action for a key pressed in the page editor, or null when the key is not one of its shortcuts */
export function getEditorKeyAction(event: EditorKeyEvent, rtl = false): EditorKey | null {
  const arrow = ARROW_ACTIONS[(rtl && RTL_ARROW[event.key]) || event.key];
  if (arrow) {
    return arrow[event.altKey ? 1 : 0];
  }
  const letter = LETTER_ACTIONS[event.key.toLowerCase()];
  if (letter) {
    const command = !!(event.metaKey || event.ctrlKey);
    return command === letter[1] ? letter[0] : null;
  }
  return PLAIN_ACTIONS[event.key] ?? null;
}
