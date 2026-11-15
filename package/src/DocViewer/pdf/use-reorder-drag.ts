import { useDrag, UseDragState } from '@mantine/hooks';
import React, { useRef, useState } from 'react';
import { getDropIndex, getMoveIndex, isNoopDrop, ItemRect, ReorderLayout } from './reorder';

/** Movement in px before a press becomes a drag, so a click still selects */
const DRAG_THRESHOLD = 6;

/** Distance from the list's edge, in px, where dragging scrolls the list */
const AUTO_SCROLL_EDGE = 40;
const AUTO_SCROLL_STEP = 16;

interface DragState {
  page: number;
  fromIndex: number;
  dropIndex: number | null;
  offset: [number, number];
}

interface ReorderListOptions {
  /** The scrolling list that holds the items, each marked with `data-reorder-item` */
  container: HTMLElement | null;
  layout: ReorderLayout;
  /** Pages in their current order */
  order: number[];
  /** Called with the page and the index it moves to (after taking it out of the list) */
  onReorder: (page: number, toIndex: number) => void;
  enabled?: boolean;
}

function readRects(container: HTMLElement): ItemRect[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-reorder-item]'), (item) =>
    item.getBoundingClientRect()
  );
}

/** Scrolls the list a step when the pointer is near its start or end edge */
function autoScroll(container: HTMLElement, [x, y]: [number, number], layout: ReorderLayout) {
  const rect = container.getBoundingClientRect();
  const vertical = layout !== 'horizontal';
  const pointer = vertical ? y : x;
  const start = vertical ? rect.top : rect.left;
  const end = vertical ? rect.bottom : rect.right;
  const step =
    pointer < start + AUTO_SCROLL_EDGE
      ? -AUTO_SCROLL_STEP
      : pointer > end - AUTO_SCROLL_EDGE
        ? AUTO_SCROLL_STEP
        : 0;
  if (step !== 0) {
    container.scrollBy(vertical ? { top: step } : { left: step });
  }
}

/**
 * Drag to reorder a list of pages with Mantine's `useDrag` (pointer events, so it works with a
 * mouse, a pen and touch). The list keeps the drag state; each item calls `useReorderItem`
 */
export function useReorderList({
  container,
  layout,
  order,
  onReorder,
  enabled = true,
}: ReorderListOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // A drag ends with a click on the item it started on; that click must not select it
  const suppressClickUntil = useRef(0);

  const handleDrag = (page: number, state: UseDragState) => {
    // Items are inside the container, so it is mounted by the time one is dragged
    const list = container!;
    const fromIndex = order.indexOf(page);

    if (state.last) {
      setDrag(null);
      suppressClickUntil.current = state.event.timeStamp + 300;
      const dropIndex = state.canceled ? null : getDropIndex(readRects(list), state.xy, layout);
      if (dropIndex !== null && !isNoopDrop(fromIndex, dropIndex)) {
        onReorder(page, getMoveIndex(fromIndex, dropIndex));
      }
      return;
    }

    autoScroll(list, state.xy, layout);
    setDrag({
      page,
      fromIndex,
      dropIndex: getDropIndex(readRects(list), state.xy, layout),
      offset: state.movement,
    });
  };

  /** Props for the item at `index`: the drop marker and the dragged item's position */
  const getItemProps = (page: number, index: number) => {
    const dropIndex =
      drag && drag.dropIndex !== null && !isNoopDrop(drag.fromIndex, drag.dropIndex)
        ? drag.dropIndex
        : null;
    const dragging = drag?.page === page;
    const drop =
      dropIndex === index ? 'before' : dropIndex === order.length && index === order.length - 1;

    return {
      'data-reorder-item': true,
      'data-dragging': dragging || undefined,
      'data-drop': drop === 'before' ? 'before' : drop ? 'after' : undefined,
      style: dragging ? { translate: `${drag.offset[0]}px ${drag.offset[1]}px` } : undefined,
    };
  };

  /** True for a click that ends a drag, which should not count as a click */
  const isDragClick = (event: React.MouseEvent) => event.timeStamp < suppressClickUntil.current;

  return { enabled, dragging: drag !== null, handleDrag, getItemProps, isDragClick };
}

export type ReorderList = ReturnType<typeof useReorderList>;

/**
 * Drag refs for one item: the whole item drags with a mouse; touch and pen drag from the
 * handle only, so that swiping elsewhere still scrolls the list
 */
export function useReorderItem(
  list: ReorderList,
  page: number
): {
  itemRef: React.RefCallback<HTMLElement | null>;
  handleRef: React.RefCallback<HTMLElement | null>;
} {
  const { enabled } = list;
  const item = useDrag(
    (state) => {
      if (state.first && state.event.pointerType !== 'mouse') {
        state.cancel();
        return;
      }
      list.handleDrag(page, state);
    },
    { threshold: DRAG_THRESHOLD, enabled }
  );
  const handle = useDrag(
    (state) => {
      if (state.first && state.event.pointerType === 'mouse') {
        state.cancel();
        return;
      }
      list.handleDrag(page, state);
    },
    { threshold: 1, enabled }
  );
  return { itemRef: item.ref, handleRef: handle.ref };
}
