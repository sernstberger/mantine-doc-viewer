import { useDrag, useMergedRef } from '@mantine/hooks';
import { useRef } from 'react';

function isOverflowing(stage: HTMLElement) {
  return stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight;
}

/**
 * Drag with the mouse to scroll around an image larger than the view, with Mantine's useDrag;
 * touch scrolls natively. Attach `ref` to the scrolling stage
 */
export function useDragToPan<T extends HTMLElement>() {
  const stageRef = useRef<T | null>(null);
  const drag = useDrag<T>((state) => {
    const stage = stageRef.current!;
    if (state.first && (state.event.pointerType !== 'mouse' || !isOverflowing(stage))) {
      state.cancel();
      return;
    }
    if (state.last) {
      return;
    }
    stage.scrollLeft -= state.delta[0];
    stage.scrollTop -= state.delta[1];
  });
  const ref = useMergedRef(stageRef, drag.ref);
  return { ref, panning: drag.active };
}
