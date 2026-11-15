import { getCanvasPixelRatio, MAX_CANVAS_PIXELS } from './render-page';

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
