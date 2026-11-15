import {
  clampPage,
  computeFitPageScale,
  computeScale,
  getPresentationTarget,
  getMostVisiblePage,
  getThumbnailsLayout,
  nextRotation,
  fitsToHeight,
  isTwoPages,
} from './geometry';

describe('pdf geometry', () => {
  it('keeps pages within the document', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(3.6, 10)).toBe(4);
    expect(clampPage(42, 10)).toBe(10);
    expect(clampPage(5, 0)).toBe(1);
  });

  it('uses the zoom, or fits the layout to the view', () => {
    const base = {
      bodyWidth: 832,
      bodyHeight: 632,
      columnGap: 16,
      pageWidth: 400,
      pageHeight: 300,
    };
    expect(computeScale({ ...base, zoom: 1.5, layout: 'single' })).toBe(1.5);
    expect(computeScale({ ...base, zoom: 'fit-width', layout: 'single' })).toBe(2);
    expect(computeScale({ ...base, zoom: 'fit-width', layout: 'two-page' })).toBeCloseTo(0.98);
    expect(computeScale({ ...base, zoom: 'fit-width', layout: 'horizontal' })).toBe(2);
    expect(computeScale({ ...base, zoom: 'fit-width', layout: 'wrapped' })).toBe(2);
  });

  it('knows which layouts show two pages and which fit to height', () => {
    expect(isTwoPages('two-page-cover')).toBe(true);
    expect(isTwoPages('wrapped')).toBe(false);
    expect(fitsToHeight('horizontal')).toBe(true);
    expect(fitsToHeight('single')).toBe(false);
  });

  it('turns a quarter at a time', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });

  it('finds the page with the most visible area, down or sideways', () => {
    const view = { top: 0, bottom: 600, left: 0, right: 800 };
    const column = [
      { page: 1, top: -500, bottom: 100, left: 0, right: 800 },
      { page: 2, top: 120, bottom: 900, left: 0, right: 800 },
    ];
    expect(getMostVisiblePage(column, view)).toBe(2);

    const row = [
      { page: 3, top: 0, bottom: 600, left: -700, right: 100 },
      { page: 4, top: 0, bottom: 600, left: 120, right: 920 },
    ];
    expect(getMostVisiblePage(row, view)).toBe(4);
    expect(getMostVisiblePage([], view)).toBe(0);
  });

  it('lays thumbnails out by position, before the pages for left and top', () => {
    expect(getThumbnailsLayout('left')).toEqual({ orientation: 'vertical', first: true });
    expect(getThumbnailsLayout('right')).toEqual({ orientation: 'vertical', first: false });
    expect(getThumbnailsLayout('top')).toEqual({ orientation: 'horizontal', first: true });
    expect(getThumbnailsLayout('bottom')).toEqual({ orientation: 'horizontal', first: false });
  });

  it('fits a whole page for presentations', () => {
    expect(computeFitPageScale(832, 432, 400, 300)).toBeCloseTo(1.333);
    expect(computeFitPageScale(432, 832, 400, 300)).toBe(1);
  });

  it('maps presentation keys to pages', () => {
    expect(getPresentationTarget('ArrowRight', 2, 5)).toBe(3);
    expect(getPresentationTarget(' ', 5, 5)).toBe(5);
    expect(getPresentationTarget('PageUp', 1, 5)).toBe(1);
    expect(getPresentationTarget('Home', 4, 5)).toBe(1);
    expect(getPresentationTarget('End', 2, 5)).toBe(5);
    expect(getPresentationTarget('Escape', 2, 5)).toBe('exit');
    expect(getPresentationTarget('a', 2, 5)).toBeNull();
  });
});
