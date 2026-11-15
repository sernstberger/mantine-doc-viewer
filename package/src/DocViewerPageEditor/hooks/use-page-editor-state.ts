import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import type { DocViewerPageEditorLabels } from '../default-labels';
import {
  initialOrder,
  isEdited,
  movePage,
  moveSelected,
  PageOrder,
  removeSelected,
} from '../utils/page-edits';
import { useAnnouncement } from '../../hooks/pdf/use-announcement';
import { usePageFocus } from './use-page-focus';
import { usePageSelection } from './use-page-selection';
import { usePageTurns } from './use-page-turns';
import { useReorderList } from '../../hooks/pdf/use-reorder-drag';

interface PageEditorStateInput {
  document: PDFDocumentProxy;
  scrollRoot: HTMLDivElement | null;
  labels: DocViewerPageEditorLabels;
}

/** The editor's pages: their order, selection, turns and focus, and the actions that change them */
export function usePageEditorState({ document, scrollRoot, labels }: PageEditorStateInput) {
  const [order, setOrder] = useState<PageOrder>(() => initialOrder(document.numPages));
  const { turnOf, turn, clearTurns } = usePageTurns();
  const [announcement, announce] = useAnnouncement();
  const edited = isEdited(order, document.numPages) || order.some((page) => turnOf(page) !== 0);
  const { focusedIndex, setFocusedIndex, focusIndex, refocus } = usePageFocus(scrollRoot, order);
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
      announce(labels.pageMovedLabel(page, toIndex + 1));
    },
  });

  /** Pages an action applies to: the selection, or the focused page when nothing is selected */
  const targets = () => (selected.size > 0 ? selected : new Set([order[focusedIndex]]));

  const move = (direction: -1 | 1) => {
    const pages = targets();
    const next = moveSelected(order, pages, direction);
    setOrder(next);
    const moved = [...pages][0];
    announce(labels.pageMovedLabel(moved, next.indexOf(moved) + 1));
    refocus(next.indexOf(order[focusedIndex]), next);
  };

  const remove = () => {
    const pages = targets();
    const next = removeSelected(order, pages);
    if (next.length === order.length) {
      return;
    }
    setOrder(next);
    clear();
    refocus(focusedIndex, next);
    announce(labels.pagesRemovedLabel(order.length - next.length));
  };

  const rotate = () => {
    const pages = targets();
    turn(pages);
    announce(labels.pagesRotatedLabel(pages.size));
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
