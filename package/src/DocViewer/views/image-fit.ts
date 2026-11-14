import { MIN_ZOOM } from '../zoom';

export type ImageRotation = 0 | 90 | 180 | 270;

export interface Size {
  width: number;
  height: number;
}

/** Space kept around the image, must match padding of the `imageCanvas` element */
export const IMAGE_GUTTER = 32;

export function getRotatedSize(size: Size, rotation: ImageRotation): Size {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

/** Largest scale that shows the whole image, never enlarging it past its natural size */
export function getImageFitScale(container: Size, image: Size, rotation: ImageRotation) {
  const rotated = getRotatedSize(image, rotation);
  const width = container.width - IMAGE_GUTTER;
  const height = container.height - IMAGE_GUTTER;

  if (width <= 0 || height <= 0 || rotated.width <= 0 || rotated.height <= 0) {
    return 1;
  }

  return Math.max(MIN_ZOOM, Math.min(1, width / rotated.width, height / rotated.height));
}
