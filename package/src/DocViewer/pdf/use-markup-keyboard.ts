import React, { useEffect, useRef, useState } from 'react';
import { focusIfLost } from '../a11y';
import { useDocViewerPageContext } from '../DocViewer.context';
import type { DocViewerMarkPoint } from './markup';
import type { Draft, TextDraft } from './markup-draft';
import { getMarkupKeyAction, MARKUP_KEY_SHORTCUTS, type MarkupKeyAction } from './markup-keys';
import type { MarkupLayerInput } from './use-markup';

interface MarkupKeyboardInput extends MarkupLayerInput {
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
 * Placing marks without a pointer: while a tool is picked the page's markup layer is a tab stop
 * with a cursor that the arrow keys move; Enter starts and finishes a mark at it, or opens a text
 * box there. What happens is read out through the viewer's status region
 */
export function useMarkupKeyboard({
  pageNumber,
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
  const { tool, announce } = markup;
  const { layerRef, returnFocusLater } = useTextBoxFocusReturn(textDraft);
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

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Keys typed into the text box are its own
    if (event.target !== event.currentTarget) {
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
      tabIndex: 0,
      role: 'application',
      'aria-label': labels.markupLayer(toolName, pageNumber),
      'aria-description': labels.markupKeys,
      'aria-keyshortcuts': MARKUP_KEY_SHORTCUTS,
      onKeyDown,
    },
  };
}
