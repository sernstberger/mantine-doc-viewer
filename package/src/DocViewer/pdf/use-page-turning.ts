import { useCallbackRef, useDrag, useWindowEvent } from '@mantine/hooks';
import React, { useRef } from 'react';
import {
  type DocViewerPageTurning,
  getSwipeDirection,
  getTapDirection,
  getTurnKeyDirection,
  type PageTurnDirection,
} from './spreads';

/** A click this soon after a swipe is the end of the swipe, not a tap, in ms */
const SWIPE_CLICK_TIME = 500;

/** Movement before a press counts as a swipe, in px */
const SWIPE_THRESHOLD = 8;

/** Controls in and over pages that take clicks themselves: links, overlay buttons and fields */
const CLICKABLE_SELECTOR = 'a, button, input, textarea, select, label, [role="button"]';

interface PageTurningInput {
  options: Required<DocViewerPageTurning>;

  /** False while loading and presenting, when nothing turns */
  active: boolean;

  /** Whether the pages fit the width of the view, so a swipe is free to turn them */
  swipeable: boolean;
  turn: (direction: PageTurnDirection) => void;
}

/**
 * Built-in page turning: clicks at the edges of the view, swipes with Mantine's useDrag, and
 * arrow, Page up and Page down keys from anywhere on the page (page turner pedals send them).
 * Attach `ref` and `onClick` to the scroll area
 */
export function usePageTurning({ options, active, swipeable, turn }: PageTurningInput): {
  ref: React.RefCallback<HTMLDivElement | null>;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
} {
  const swipedAt = useRef(-Infinity);

  useWindowEvent(
    'keydown',
    useCallbackRef((event: KeyboardEvent) => {
      const direction = active && options.keys ? getTurnKeyDirection(event) : null;
      if (direction) {
        event.preventDefault();
        turn(direction);
      }
    })
  );

  // A mouse drag selects text, so only fingers and pens swipe
  const drag = useDrag<HTMLDivElement>(
    (state) => {
      if (state.first && (state.event.pointerType === 'mouse' || !swipeable)) {
        state.cancel();
        return;
      }
      const direction = state.last && !state.canceled ? getSwipeDirection(state.movement) : null;
      if (direction) {
        swipedAt.current = state.event.timeStamp;
        turn(direction);
      }
    },
    { enabled: active && options.swipe, threshold: SWIPE_THRESHOLD }
  );

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!active || !options.tapZones || event.timeStamp - swipedAt.current < SWIPE_CLICK_TIME) {
      return;
    }
    // Links, overlay buttons and text being selected keep their clicks
    const target = event.target as Element;
    if (target.closest(CLICKABLE_SELECTOR) || !window.getSelection()!.isCollapsed) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const direction = getTapDirection(event.clientX, rect.left, rect.width);
    direction && turn(direction);
  };

  return { ref: drag.ref, onClick };
}
