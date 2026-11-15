import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import {
  initialOrder,
  isEdited,
  movePage,
  moveSelected,
  PageOrder,
  removeSelected,
} from './page-edits';
import { useAnnouncement } from './use-announcement';
import { usePageFocus } from './use-page-focus';
import { usePageSelection } from './use-page-selection';
import { usePageTurns } from './use-page-turns';
import { useReorderList } from './use-reorder-drag';

interface PageEditorStateInput {
  document: PDFDocumentProxy;
  scrollRoot: HTMLDivElement | null;
}

/** The editor's pages: their order, selection, turns and focus, and the actions that change them */
export function usePageEditorState({ document, scrollRoot }: PageEditorStateInput) {
  const { labels } = useDocViewerContext();
  const [order, setOrder] = useState<PageOrder>(() => initialOrder(document.numPages));
  const { turnOf, turn, clearTurns } = usePageTurns();
  const [announcement, announce] = useAnnouncement();
  const edited = isEdited(order, document.numPages) || order.some((page) => turnOf(page) !== 0);
  const { focusedIndex, setFocusedIndex, focusIndex } = usePageFocus(scrollRoot, order);
  const pageSelection = usePageSelection(order);
  const { selected, clear } = pageSelection;
  const reorder = useReorderList({
    container: scrollRoot,
    layout: 'grid',
    order,
    onReorder: (page, toIndex) => {
      const next = movePage(order, page, toIndex);
      setOrder(next);
      setFocusedIndex(toIndex);
      announce(labels.pageMoved(page, toIndex + 1));
    },
  });

  /** Pages an action applies to: the selection, or the focused page when nothing is selected */
  const targets = () => (selected.size > 0 ? selected : new Set([order[focusedIndex]]));

  const move = (direction: -1 | 1) => {
    const pages = targets();
    const next = moveSelected(order, pages, direction);
    setOrder(next);
    const moved = [...pages][0];
    announce(labels.pageMoved(moved, next.indexOf(moved) + 1));
    requestAnimationFrame(() => focusIndex(next.indexOf(order[focusedIndex]), next));
  };

  const remove = () => {
    const pages = targets();
    const next = removeSelected(order, pages);
    if (next.length === order.length) {
      return;
    }
    setOrder(next);
    clear();
    // The focused page may be gone: keep keyboard focus in the list
    requestAnimationFrame(() => focusIndex(focusedIndex, next));
    announce(labels.pagesRemoved(order.length - next.length));
  };

  const rotate = () => {
    const pages = targets();
    turn(pages);
    announce(labels.pagesRotated(pages.size));
  };

  const reset = () => {
    setOrder(initialOrder(document.numPages));
    clearTurns();
    clear();
  };

  /** A click on the page at this index: shift, meta or ctrl add to the selection */
  const select = (page: number, index: number, event: React.MouseEvent) => {
    setFocusedIndex(index);
    pageSelection.click(page, event);
  };

  return {
    order,
    ...pageSelection,
    focusedIndex,
    announcement,
    edited,
    turnOf,
    reorder,
    focusIndex,
    move,
    remove,
    rotate,
    reset,
    select,
  };
}

export type PageEditorState = ReturnType<typeof usePageEditorState>;
