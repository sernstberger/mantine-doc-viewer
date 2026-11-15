import { useEffect, useState } from 'react';

/** Drag with the mouse to scroll around an image larger than the view, touch scrolls natively */
export function useDragToPan(stage: HTMLDivElement | null) {
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    if (!stage) {
      return undefined;
    }

    let last: { x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      const overflowing =
        stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight;
      if (event.button !== 0 || event.pointerType !== 'mouse' || !overflowing) {
        return;
      }

      last = { x: event.clientX, y: event.clientY };
      stage.setPointerCapture?.(event.pointerId);
      setPanning(true);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!last) {
        return;
      }

      stage.scrollLeft -= event.clientX - last.x;
      stage.scrollTop -= event.clientY - last.y;
      last = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = () => {
      last = null;
      setPanning(false);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    return () => {
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
    };
  }, [stage]);

  return panning;
}
