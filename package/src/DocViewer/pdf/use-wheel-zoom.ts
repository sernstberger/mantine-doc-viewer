import { useEffect, useRef } from 'react';
import { clampZoom } from '../zoom';
import { getWheelScale } from '../views/image-zoom';

/** Pinch on a trackpad arrives as a wheel event with ctrlKey set; Ctrl+wheel zooms too */
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
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setZoomRef.current(clampZoom(getWheelScale(scaleRef.current, event.deltaY)));
      }
    };
    scrollRoot.addEventListener('wheel', onWheel, { passive: false });
    return () => scrollRoot.removeEventListener('wheel', onWheel);
  }, [scrollRoot, enabled]);
}
