import React from 'react';
import { EditorKeyAction, getEditorKeyAction } from './editor-keys';
import type { PageEditorState } from './use-page-editor-state';

type PageEditorKeysInput = Pick<
  PageEditorState,
  'order' | 'focusedIndex' | 'focusIndex' | 'toggle' | 'move' | 'remove' | 'rotate' | 'selectAll'
>;

/** The keydown handler of the page list: each key runs one editor action */
export function usePageEditorKeys(editor: PageEditorKeysInput) {
  const { order, focusedIndex, focusIndex } = editor;
  const keyActions: Record<EditorKeyAction, (step: -1 | 1) => void> = {
    move: (step) => editor.move(step),
    focus: (step) => focusIndex(focusedIndex + step),
    focusFirst: () => focusIndex(0),
    focusLast: () => focusIndex(order.length - 1),
    toggle: () => editor.toggle(order[focusedIndex]),
    remove: () => editor.remove(),
    rotate: () => editor.rotate(),
    selectAll: () => editor.selectAll(),
  };

  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = getEditorKeyAction(event);
    if (key) {
      event.preventDefault();
      keyActions[key.action](key.step);
    }
  };
}
