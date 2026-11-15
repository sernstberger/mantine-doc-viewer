import {
  clampPage,
  computeScale,
  getMostVisiblePage,
  getThumbnailsLayout,
  nextRotation,
  toggleTwoPages,
} from './geometry';

describe('pdf geometry', () => {
  it('keeps pages within the document', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(3.6, 10)).toBe(4);
    expect(clampPage(42, 10)).toBe(10);
    expect(clampPage(5, 0)).toBe(1);
  });

  it('uses the zoom, or fits one or two pages to the width', () => {
    const base = { bodyWidth: 832, columnGap: 16, pageWidth: 400 };
    expect(computeScale({ ...base, zoom: 1.5, twoPages: false })).toBe(1.5);
    expect(computeScale({ ...base, zoom: 'fit-width', twoPages: false })).toBe(2);
    expect(computeScale({ ...base, zoom: 'fit-width', twoPages: true })).toBeCloseTo(0.98);
  });

  it('turns a quarter at a time', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });

  it('toggles two pages in the flavour the viewer opened with', () => {
    expect(toggleTwoPages('single', undefined)).toBe('two-page');
    expect(toggleTwoPages('single', 'two-page-cover')).toBe('two-page-cover');
    expect(toggleTwoPages('two-page', 'two-page')).toBe('single');
  });

  it('finds the page with the most visible height', () => {
    const boxes = [
      { page: 1, top: -500, bottom: 100 },
      { page: 2, top: 120, bottom: 900 },
    ];
    expect(getMostVisiblePage(boxes, 0, 600)).toBe(2);
    expect(getMostVisiblePage([], 0, 600)).toBe(0);
  });

  it('lays thumbnails out by position, before the pages for left and top', () => {
    expect(getThumbnailsLayout('left')).toEqual({ orientation: 'vertical', first: true });
    expect(getThumbnailsLayout('right')).toEqual({ orientation: 'vertical', first: false });
    expect(getThumbnailsLayout('top')).toEqual({ orientation: 'horizontal', first: true });
    expect(getThumbnailsLayout('bottom')).toEqual({ orientation: 'horizontal', first: false });
  });
});
