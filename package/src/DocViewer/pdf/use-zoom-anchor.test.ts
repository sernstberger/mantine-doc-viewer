import { getAnchoredScroll } from './use-zoom-anchor';

describe('getAnchoredScroll', () => {
  it('keeps the middle of the view on the same point when zooming', () => {
    // Middle of a 600px view at 1000 + 300 = 1300; at twice the size that point is at 2600
    expect(getAnchoredScroll(1000, 600, 2)).toBe(2300);
    expect(getAnchoredScroll(1000, 600, 0.5)).toBe(350);
  });

  it('never scrolls before the start', () => {
    expect(getAnchoredScroll(0, 600, 0.5)).toBe(0);
  });
});
