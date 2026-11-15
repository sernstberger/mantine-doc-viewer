import React, { useEffect, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import type { DocViewerMarkPoint } from './markup';
import type { Draft, TextDraft } from './markup-draft';
import { getMarkupKeyAction, MARKUP_KEY_SHORTCUTS, type MarkupKeyAction } from './markup-keys';
import type { MarkupLayerInput } from './markup-layer-input';

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
  const { labels } = useDocViewerContext();
  const { tool, announce } = markup;
  const layerRef = useRef<HTMLDivElement>(null);
  const [caretPoint, setCaret] = useState<DocViewerMarkPoint | null>(null);
  // The cursor starts in the middle of the page
  const caret = caretPoint ?? [width / 2, height / 2];
  // A text box opened from the keyboard gives focus back to the page when it closes
  const returnFocus = useRef(false);

  useEffect(() => {
    if (textDraft || !returnFocus.current) {
      return;
    }
    returnFocus.current = false;
    // Only when the box took focus with it; a click or Tab elsewhere keeps its own focus
    document.activeElement === document.body && layerRef.current?.focus();
  }, [textDraft]);

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
      returnFocus.current = true;
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
