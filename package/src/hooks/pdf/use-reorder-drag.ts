import { useDirection } from '@mantine/core';
import { useCallbackRef, useDrag, UseDragState } from '@mantine/hooks';
import React, { useMemo, useRef, useState } from 'react';
import {
  getDropIndex,
  getMoveIndex,
  isNoopDrop,
  ItemRect,
  ReorderLayout,
} from '../../utils/reorder';

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

/** How one item shows the drag: the dragged item moves with the pointer, the drop target is marked */
export interface ReorderItemState {
  dragging?: boolean;
  drop?: 'before' | 'after';
  offset?: [number, number];
}

/** The state of every item the drag does not touch: one object, so those items keep their props */
const IDLE: ReorderItemState = {};

/** Data attributes and style for an item in its drag state */
export function getReorderItemProps({ dragging, drop, offset }: ReorderItemState) {
  return {
    'data-reorder-item': true,
    'data-dragging': dragging || undefined,
    'data-drop': drop,
    style: offset ? { translate: `${offset[0]}px ${offset[1]}px` } : undefined,
  };
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
  const rtl = useDirection().dir === 'rtl';
  const suppressClickUntil = useRef(0);

  const handleDrag = useCallbackRef((page: number, state: UseDragState) => {
    const list = container!;
    const fromIndex = order.indexOf(page);

    if (state.last) {
      setDrag(null);
      suppressClickUntil.current = state.event.timeStamp + 300;
      const dropIndex = state.canceled
        ? null
        : getDropIndex(readRects(list), state.xy, layout, rtl);
      if (dropIndex !== null && !isNoopDrop(fromIndex, dropIndex)) {
        onReorder(page, getMoveIndex(fromIndex, dropIndex));
      }
      return;
    }

    autoScroll(list, state.xy, layout);
    setDrag({
      page,
      fromIndex,
      dropIndex: getDropIndex(readRects(list), state.xy, layout, rtl),
      offset: state.movement,
    });
  });

  /** True for a click that ends a drag, which should not count as a click */
  const isDragClick = useCallbackRef(
    (event: React.MouseEvent) => event.timeStamp < suppressClickUntil.current
  );

  /** The drop marker and the dragged item's position for the item at `index` */
  const getItemState = (page: number, index: number): ReorderItemState => {
    const dropIndex =
      drag && drag.dropIndex !== null && !isNoopDrop(drag.fromIndex, drag.dropIndex)
        ? drag.dropIndex
        : null;
    const dragging = drag?.page === page;
    const drop =
      dropIndex === index
        ? 'before'
        : dropIndex === order.length && index === order.length - 1
          ? 'after'
          : undefined;
    return dragging || drop ? { dragging, drop, offset: dragging ? drag.offset : undefined } : IDLE;
  };

  const list = useMemo(
    () => ({ enabled, handleDrag, isDragClick }),
    [enabled, handleDrag, isDragClick]
  );

  return { list, dragging: drag !== null, getItemState };
}

/** What each item takes from the list: the same object while dragging stays enabled or not */
export type ReorderList = ReturnType<typeof useReorderList>['list'];

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
