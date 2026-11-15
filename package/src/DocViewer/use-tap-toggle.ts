import { useRef, useState } from 'react';

/** Movement in px that turns a tap into a scroll or a drag */
const TAP_SLOP = 10;

/** Longest press in ms that is still a tap */
const TAP_TIME = 500;

/** Elements that use a tap themselves */
const INTERACTIVE =
  'a, button, input, select, textarea, summary, label, [data-doc-viewer-toolbar], [role="button"], [role="dialog"], [role="slider"]';

/**
 * Hides and shows the toolbar when a finger taps the viewer. Mouse and pen clicks, scrolls, drags
 * and taps on buttons, links or the toolbar do nothing
 */
export function useTapToggle(enabled: boolean | undefined) {
  const [hidden, setHidden] = useState(false);
  const start = useRef<{ id: number; x: number; y: number; time: number } | null>(null);

  if (!enabled) {
    return { hidden: false, handlers: {} };
  }

  return {
    hidden,
    handlers: {
      onPointerDown: (event: React.PointerEvent) => {
        start.current =
          event.pointerType === 'touch' && event.isPrimary
            ? { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp }
            : null;
      },
      onPointerUp: (event: React.PointerEvent) => {
        const tap = start.current;
        start.current = null;
        if (
          tap &&
          tap.id === event.pointerId &&
          Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < TAP_SLOP &&
          event.timeStamp - tap.time < TAP_TIME &&
          !(event.target as Element).closest(INTERACTIVE)
        ) {
          setHidden((current) => !current);
        }
      },
      onPointerCancel: () => {
        start.current = null;
      },
    },
  };
}
