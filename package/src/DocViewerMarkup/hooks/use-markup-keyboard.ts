import { useMergedRef } from '@mantine/hooks';
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { focusIfLost } from '../../utils/a11y';
import type { DocViewerMarkupLabels } from '../default-labels';
import type { DocViewerMarkPoint } from '../utils/markup';
import type { Draft, TextDraft } from '../utils/markup-draft';
import {
  getMarkupKeyAction,
  MARKUP_KEY_SHORTCUTS,
  type MarkupKeyAction,
} from '../utils/markup-keys';
import type { MarkupLayerInput } from './use-markup';

/** Keys that move focus to the markup layer of the page before or after */
const PAGE_STEPS: Record<string, number> = { PageUp: -1, PageDown: 1 };

const hasModifier = (event: KeyboardEvent) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

/** Pages to move by for the key: 1 for Page Down, -1 for Page Up, 0 for other keys */
const getPageStep = (event: KeyboardEvent) =>
  hasModifier(event) ? 0 : (PAGE_STEPS[event.key] ?? 0);

interface MarkupKeyboardInput extends MarkupLayerInput {
  numPages: number;
  /** The layer the Tab key reaches: the current page's, so the pages are one tab stop */
  tabStop: boolean;
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  /** Writes a draft into the marks, and says whether it made a mark */
  commit: (draft: Draft) => boolean;
  textDraft: TextDraft | null;
  setTextDraft: (draft: TextDraft | null) => void;
}

type MoveAction = Extract<MarkupKeyAction, { type: 'move' }>;

/**
 * The page's markup layer, and focus back on it when a text box opened from the keyboard closes.
 * Only when the box took focus with it; a click or Tab elsewhere keeps its own focus
 */
function useTextBoxFocusReturn(textDraft: TextDraft | null) {
  const layerRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (!textDraft && pending.current) {
      pending.current = false;
      focusIfLost(layerRef.current);
    }
  }, [textDraft]);

  return {
    layerRef,
    returnFocusLater: () => {
      pending.current = true;
    },
  };
}

/** The layer's ref: registered with the markup by page, and focused again after a text box */
function useLayerRef(
  pageNumber: number,
  registerLayer: (pageNumber: number, node: HTMLElement | null) => void,
  textDraft: TextDraft | null
) {
  const { layerRef: focusReturnRef, returnFocusLater } = useTextBoxFocusReturn(textDraft);
  const register = useCallback(
    (node: HTMLDivElement | null) => registerLayer(pageNumber, node),
    [registerLayer, pageNumber]
  );
  return { layerRef: useMergedRef(focusReturnRef, register), returnFocusLater };
}

interface KeyActionsInput {
  toolName: string;
  caret: DocViewerMarkPoint;
  draft: Draft | null;
  setCaret: (caret: DocViewerMarkPoint) => void;
  setDraft: (draft: Draft | null) => void;
  commit: (draft: Draft) => boolean;
  setTextDraft: (draft: TextDraft | null) => void;
  returnFocusLater: () => void;
  labels: DocViewerMarkupLabels;
  announce: (message: string) => void;
}

/** What each markup key action does, and what it reads out */
function getKeyActions({
  toolName,
  caret,
  draft,
  setCaret,
  setDraft,
  commit,
  setTextDraft,
  returnFocusLater,
  labels,
  announce,
}: KeyActionsInput): Record<MarkupKeyAction['type'], (action: MarkupKeyAction) => void> {
  return {
    move: (action) => {
      const moved = action as MoveAction;
      !draft && moved.draft && announce(labels.markStartedLabel(toolName));
      setCaret(moved.caret);
      setDraft(moved.draft);
    },
    start: () => {
      setDraft([caret]);
      announce(labels.markStartedLabel(toolName));
    },
    finish: () => {
      const added = commit(draft!);
      setDraft(null);
      announce(added ? labels.markAddedLabel(toolName) : labels.markCancelledLabel);
    },
    cancel: () => {
      setDraft(null);
      announce(labels.markCancelledLabel);
    },
    text: () => {
      returnFocusLater();
      setTextDraft({ x: caret[0], y: caret[1], text: '' });
    },
  };
}

/**
 * Placing marks without a pointer: while a tool is picked the current page's markup layer is a
 * tab stop with a cursor that the arrow keys move; Enter starts and finishes a mark at it, or
 * opens a text box there, and Page Up and Page Down move to the layer of the page before or
 * after. What happens is read out through the viewer's status region
 */
export function useMarkupKeyboard({
  pageNumber,
  numPages,
  tabStop,
  width,
  height,
  rotation,
  markup,
  draft,
  setDraft,
  commit,
  textDraft,
  setTextDraft,
}: MarkupKeyboardInput) {
  const { tool, labels, announce, registerLayer } = markup;
  const { layerRef, returnFocusLater } = useLayerRef(pageNumber, registerLayer, textDraft);
  const [caretPoint, setCaret] = useState<DocViewerMarkPoint | null>(null);
  const caret = caretPoint ?? [width / 2, height / 2];

  if (!tool) {
    return { layerRef, caret: null, keyboardProps: {} };
  }
  const toolName = labels.markupToolLabels[tool];

  const actions = getKeyActions({
    toolName,
    caret,
    draft,
    setCaret,
    setDraft,
    commit,
    setTextDraft,
    returnFocusLater,
    labels,
    announce,
  });

  const goToPage = (step: number) => {
    const target = pageNumber + step;
    if (target >= 1 && target <= numPages) {
      draft && actions.cancel({ type: 'cancel' });
      markup.focusPage(target);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    const step = getPageStep(event);
    const action = step
      ? null
      : getMarkupKeyAction(event, { tool, caret, draft, width, height, rotation });
    if (step || action) {
      event.preventDefault();
      event.stopPropagation();
      step ? goToPage(step) : actions[action!.type](action!);
    }
  };

  return {
    layerRef,
    caret,
    keyboardProps: {
      tabIndex: tabStop ? 0 : -1,
      role: 'application',
      'aria-label': labels.markupLayerLabel(toolName, pageNumber),
      'aria-description': labels.markupKeysLabel,
      'aria-keyshortcuts': `${MARKUP_KEY_SHORTCUTS} PageUp PageDown`,
      onKeyDown,
    },
  };
}
