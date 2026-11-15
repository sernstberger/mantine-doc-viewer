import { clamp } from '@mantine/hooks';

export const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8];

export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

export function clampZoom(scale: number) {
  return clamp(scale, MIN_ZOOM, MAX_ZOOM);
}

/** Next zoom step up, also from scales between steps such as a fitted scale */
export function zoomIn(scale: number) {
  return ZOOM_STEPS.find((step) => step > scale + 0.001) ?? MAX_ZOOM;
}

export function zoomOut(scale: number) {
  return [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? MIN_ZOOM;
}
