import { useMergedRef } from '@mantine/hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { focusIfLost } from '../a11y';
import { useDocViewerPageContext } from '../DocViewer.context';
import type { DocViewerMarkPoint } from './markup';
import type { Draft, TextDraft } from './markup-draft';
import { getMarkupKeyAction, MARKUP_KEY_SHORTCUTS, type MarkupKeyAction } from './markup-keys';
import type { MarkupLayerInput } from './use-markup';

/** Keys that move focus to the markup layer of the page before or after */
const PAGE_STEPS: Record<string, number> = { PageUp: -1, PageDown: 1 };

const hasModifier = (event: React.KeyboardEvent) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

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
  const { labels } = useDocViewerPageContext();
  const { tool, announce, registerLayer } = markup;
  const { layerRef: focusReturnRef, returnFocusLater } = useTextBoxFocusReturn(textDraft);
  const register = useCallback(
    (node: HTMLDivElement | null) => registerLayer(pageNumber, node),
    [registerLayer, pageNumber]
  );
  const layerRef = useMergedRef(focusReturnRef, register);
  const [caretPoint, setCaret] = useState<DocViewerMarkPoint | null>(null);
  // The cursor starts in the middle of the page
  const caret = caretPoint ?? [width / 2, height / 2];

  if (!tool) {
    return { layerRef, caret: null, keyboardProps: {} };
  }
  const toolName = labels.markupTools[tool];

  const actions: Record<MarkupKeyAction['type'], (action: MarkupKeyAction) => void> = {
    move: (action) => {
      const moved = action as MoveAction;
      !draft && moved.draft && announce(labels.markStarted(toolName));
      setCaret(moved.caret);
      setDraft(moved.draft);
    },
    start: () => {
      setDraft([caret]);
      announce(labels.markStarted(toolName));
    },
    finish: () => {
      const added = commit(draft!);
      setDraft(null);
      announce(added ? labels.markAdded(toolName) : labels.markCancelled);
    },
    cancel: () => {
      setDraft(null);
      announce(labels.markCancelled);
    },
    // An open text box was written when focus left it for the page
    text: () => {
      returnFocusLater();
      setTextDraft({ x: caret[0], y: caret[1], text: '' });
    },
  };

  const goToPage = (step: number) => {
    const target = pageNumber + step;
    if (target < 1 || target > numPages) {
      return;
    }
    draft && actions.cancel({ type: 'cancel' });
    markup.focusPage(target);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Keys typed into the text box are its own
    if (event.target !== event.currentTarget) {
      return;
    }
    const step = PAGE_STEPS[event.key];
    if (step && !hasModifier(event)) {
      event.preventDefault();
      event.stopPropagation();
      goToPage(step);
      return;
    }
    const action = getMarkupKeyAction(event, { tool, caret, draft, width, height, rotation });
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      actions[action.type](action);
    }
  };

  return {
    layerRef,
    caret,
    keyboardProps: {
      tabIndex: tabStop ? 0 : -1,
      role: 'application',
      'aria-label': labels.markupLayer(toolName, pageNumber),
      'aria-description': labels.markupKeys,
      'aria-keyshortcuts': `${MARKUP_KEY_SHORTCUTS} PageUp PageDown`,
      onKeyDown,
    },
  };
}
