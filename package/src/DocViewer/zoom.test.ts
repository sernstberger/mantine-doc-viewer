import { getFitWidthScale, PAGES_GUTTER } from './pdf/zoom';
import { clampZoom, MAX_ZOOM, MIN_ZOOM, zoomIn, zoomOut } from './zoom';

describe('zoom', () => {
  it('steps to the next zoom level, including from scales between steps', () => {
    expect(zoomIn(1)).toBe(1.25);
    expect(zoomIn(1.1)).toBe(1.25);
    expect(zoomOut(1.1)).toBe(1);
    expect(zoomIn(MAX_ZOOM)).toBe(MAX_ZOOM);
    expect(zoomOut(MIN_ZOOM)).toBe(MIN_ZOOM);
  });

  it('clamps scales to the zoom range', () => {
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(1.7)).toBe(1.7);
  });

  it('fits a PDF page to the container width minus the gutter', () => {
    expect(getFitWidthScale(612 + PAGES_GUTTER, 612)).toBe(1);
    expect(getFitWidthScale(1224 + PAGES_GUTTER, 612)).toBe(2);
    expect(getFitWidthScale(0, 612)).toBe(1);
  });
});
