import React, { useState } from 'react';
import type { PageOrder } from '../../utils/page-edits';
import { clickSelection, toggleSelection } from '../../utils/page-selection';

/** Which pages are selected, in page numbers; `selection` lists them in the order on screen */
export function usePageSelection(order: PageOrder) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (page: number) => setSelected((current) => toggleSelection(current, page));

  return {
    selected,
    selection: order.filter((page) => selected.has(page)),
    toggle,
    clear: () => setSelected(new Set()),
    selectAll: () => setSelected(new Set(order)),
    /** A click on this page: shift, meta or ctrl add to the selection */
    click: (page: number, event: React.MouseEvent) =>
      event.shiftKey || event.metaKey || event.ctrlKey
        ? toggle(page)
        : setSelected(clickSelection(selected, page)),
  };
}
