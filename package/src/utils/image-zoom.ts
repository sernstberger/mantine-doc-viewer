import type { ImageRotation } from './image-fit';
import { getScrollLeft, setScrollLeft } from './scroll-left';

export type ImageZoom = number | 'fit';

/** Point that stays under the pointer (or the middle of the view) while zooming */
export interface ZoomAnchor {
  x: number;
  y: number;
  ratioX: number;
  ratioY: number;
}

export function getAnchor(stage: HTMLElement, clientX?: number, clientY?: number): ZoomAnchor {
  const rect = stage.getBoundingClientRect();
  const x = clientX === undefined ? stage.clientWidth / 2 : clientX - rect.left;
  const y = clientY === undefined ? stage.clientHeight / 2 : clientY - rect.top;

  return {
    x,
    y,
    ratioX: stage.scrollWidth > 0 ? (getScrollLeft(stage) + x) / stage.scrollWidth : 0.5,
    ratioY: stage.scrollHeight > 0 ? (stage.scrollTop + y) / stage.scrollHeight : 0.5,
  };
}

/** Scrolls so that the anchor point is back under the pointer after the size changed */
export function applyAnchor(stage: HTMLElement, anchor: ZoomAnchor) {
  setScrollLeft(stage, anchor.ratioX * stage.scrollWidth - anchor.x);
  stage.scrollTop = anchor.ratioY * stage.scrollHeight - anchor.y;
}

/** Whether the zoomed image is larger than the view, with a pixel of rounding allowed */
export function isOverflowing(stage: HTMLElement) {
  return stage.scrollWidth > stage.clientWidth + 1 || stage.scrollHeight > stage.clientHeight + 1;
}

export type ImageKeyAction = 'zoom-in' | 'zoom-out' | 'fit' | 'rotate';

const KEY_ACTIONS: Record<string, ImageKeyAction> = {
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
  '0': 'fit',
  r: 'rotate',
};

/** Action for a key pressed on the image, none while a modifier is held so browser shortcuts still work */
export function getImageKeyAction(event: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}): ImageKeyAction | null {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return null;
  }
  return KEY_ACTIONS[event.key] ?? null;
}

export function nextImageRotation(rotation: ImageRotation): ImageRotation {
  return ((rotation + 90) % 360) as ImageRotation;
}

/** Scale after a pinch or Ctrl+wheel: smooth, proportional to how far the wheel moved */
export function getWheelScale(scale: number, deltaY: number) {
  return scale * Math.exp(-deltaY * 0.01);
}
