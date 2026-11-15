import { getCanvasPixelRatio, getPageViewport, MAX_CANVAS_PIXELS, rotateSize } from './render-page';

describe('getCanvasPixelRatio', () => {
  it('uses the screen pixel density when the canvas fits', () => {
    expect(getCanvasPixelRatio(612, 792, 2, MAX_CANVAS_PIXELS)).toBe(2);
  });

  it('lowers the density so a zoomed page stays within the pixel limit', () => {
    // A4 at 800% on a 2x screen would be about 124 million pixels
    const width = 612 * 8;
    const height = 792 * 8;
    const ratio = getCanvasPixelRatio(width, height, 2, MAX_CANVAS_PIXELS);

    expect(ratio).toBeLessThan(2);
    expect(width * ratio * height * ratio).toBeCloseTo(MAX_CANVAS_PIXELS, -2);
  });

  it('keeps the density for empty pages', () => {
    expect(getCanvasPixelRatio(0, 0, 2, MAX_CANVAS_PIXELS)).toBe(2);
  });
});

describe('rotation', () => {
  it('adds the viewer rotation to the page rotation', () => {
    const getViewport = jest.fn();
    getPageViewport({ rotate: 270, getViewport } as any, 2, 180);
    expect(getViewport).toHaveBeenCalledWith({ scale: 2, rotation: 90 });
  });

  it('swaps width and height for quarter turns', () => {
    expect(rotateSize({ width: 1, height: 2 }, 90)).toEqual({ width: 2, height: 1 });
    expect(rotateSize({ width: 1, height: 2 }, 180)).toEqual({ width: 1, height: 2 });
  });
});
