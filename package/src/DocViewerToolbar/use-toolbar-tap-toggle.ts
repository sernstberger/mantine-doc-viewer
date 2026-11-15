import { useToggle } from '@mantine/hooks';
import { useEffect } from 'react';

const TAP_SLOP = 10;
const TAP_TIME = 500;
const INTERACTIVE =
  'a, button, input, select, textarea, summary, label, [data-doc-viewer-toolbar], [role="button"], [role="dialog"], [role="slider"]';

interface Tap {
  id: number;
  x: number;
  y: number;
  time: number;
}

function isTap(start: Tap, event: PointerEvent) {
  return (
    start.id === event.pointerId &&
    Math.hypot(event.clientX - start.x, event.clientY - start.y) < TAP_SLOP &&
    event.timeStamp - start.time < TAP_TIME &&
    !(event.target as Element).closest(INTERACTIVE)
  );
}

/**
 * Hides and shows the toolbar when a finger taps the viewer the toolbar is in. Mouse and pen
 * clicks, scrolls, drags and taps on buttons, links or the toolbar do nothing
 */
export function useToolbarTapToggle(enabled: boolean | undefined, toolbar: HTMLElement | null) {
  const [hidden, toggleHidden] = useToggle();

  useEffect(() => {
    const viewer = enabled ? toolbar?.closest<HTMLElement>('[data-doc-type]') : null;
    if (!viewer) {
      return undefined;
    }

    let start: Tap | null = null;
    const down = (event: PointerEvent) => {
      start =
        event.pointerType === 'touch' && event.isPrimary
          ? { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp }
          : null;
    };
    const up = (event: PointerEvent) => {
      const tap = start;
      start = null;
      tap && isTap(tap, event) && toggleHidden();
    };
    const cancel = () => {
      start = null;
    };

    viewer.addEventListener('pointerdown', down);
    viewer.addEventListener('pointerup', up);
    viewer.addEventListener('pointercancel', cancel);
    return () => {
      viewer.removeEventListener('pointerdown', down);
      viewer.removeEventListener('pointerup', up);
      viewer.removeEventListener('pointercancel', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, toolbar]);

  return !!enabled && hidden;
}
