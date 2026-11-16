import type { KeyboardEvent } from 'react';
import { zoomIn, zoomOut } from '../../utils/zoom';
import { getImageKeyAction, type ImageZoom } from '../../utils/image-zoom';

interface ImageKeyInput {
  scale: number;
  zoomTo: (zoom: ImageZoom) => void;
  rotate: () => void;
}

/** Keyboard handler for the image stage: one table of key action to what it does */
export function useImageKeys({ scale, zoomTo, rotate }: ImageKeyInput) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    const action = getImageKeyAction(event);
    if (!action) {
      return;
    }

    event.preventDefault();
    const actions = {
      'zoom-in': () => zoomTo(zoomIn(scale)),
      'zoom-out': () => zoomTo(zoomOut(scale)),
      fit: () => zoomTo('fit'),
      rotate,
    };
    actions[action]();
  };
}
