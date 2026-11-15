import { useEffect, useRef } from 'react';
import { clampZoom } from '../../utils/zoom';
import { getWheelScale } from '../../utils/image-zoom';

/**
 * Pinch on a trackpad arrives as a wheel event with ctrlKey set; Ctrl+wheel zooms too. A pinch
 * sends 60 or more events a second, so they are added up and the zoom is set once per frame:
 * each new scale draws every page near the view again
 */
export function useWheelZoom(
  scrollRoot: HTMLElement | null,
  enabled: boolean,
  scale: number,
  setZoom: (scale: number) => void
) {
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const setZoomRef = useRef(setZoom);
  setZoomRef.current = setZoom;

  useEffect(() => {
    if (!scrollRoot || !enabled) {
      return undefined;
    }

    // The scale the events so far lead to, set at the next frame
    let pending: number | null = null;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const next = pending!;
      pending = null;
      setZoomRef.current(next);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        pending = clampZoom(getWheelScale(pending ?? scaleRef.current, event.deltaY));
        frame ||= requestAnimationFrame(apply);
      }
    };
    scrollRoot.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      scrollRoot.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frame);
    };
  }, [scrollRoot, enabled]);
}
