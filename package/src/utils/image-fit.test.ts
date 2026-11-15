import { getImageFitScale, getRotatedSize, IMAGE_GUTTER } from './image-fit';

const container = (width: number, height: number) => ({
  width: width + IMAGE_GUTTER,
  height: height + IMAGE_GUTTER,
});

describe('image fit', () => {
  it('shrinks large images to fit the tighter side', () => {
    expect(getImageFitScale(container(600, 400), { width: 1200, height: 400 }, 0)).toBe(0.5);
    expect(getImageFitScale(container(600, 400), { width: 600, height: 800 }, 0)).toBe(0.5);
  });

  it('does not enlarge small images', () => {
    expect(getImageFitScale(container(600, 400), { width: 100, height: 50 }, 0)).toBe(1);
  });

  it('swaps width and height when rotated by 90 or 270 degrees', () => {
    const image = { width: 800, height: 200 };
    expect(getRotatedSize(image, 90)).toEqual({ width: 200, height: 800 });
    expect(getRotatedSize(image, 180)).toEqual(image);
    expect(getImageFitScale(container(400, 400), image, 0)).toBe(0.5);
    expect(getImageFitScale(container(400, 400), image, 270)).toBe(0.5);
    expect(getImageFitScale(container(800, 400), image, 90)).toBe(0.5);
  });

  it('falls back to 1 before anything has been measured', () => {
    expect(getImageFitScale({ width: 0, height: 0 }, { width: 800, height: 600 }, 0)).toBe(1);
    expect(getImageFitScale(container(600, 400), { width: 0, height: 0 }, 0)).toBe(1);
  });
});
