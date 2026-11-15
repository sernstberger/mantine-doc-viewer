import { getNextThumbnailPage, getThumbnailsPerView } from './PdfThumbnails';

describe('thumbnail keys', () => {
  it('moves by one, a view, or to either end, within the document', () => {
    expect(getNextThumbnailPage('ArrowDown', 3, 10, 4)).toBe(4);
    expect(getNextThumbnailPage('ArrowRight', 3, 10, 4)).toBe(4);
    expect(getNextThumbnailPage('ArrowUp', 1, 10, 4)).toBe(1);
    expect(getNextThumbnailPage('ArrowLeft', 3, 10, 4)).toBe(2);
    expect(getNextThumbnailPage('PageDown', 8, 10, 4)).toBe(10);
    expect(getNextThumbnailPage('PageUp', 3, 10, 4)).toBe(1);
    expect(getNextThumbnailPage('Home', 7, 10, 4)).toBe(1);
    expect(getNextThumbnailPage('End', 2, 10, 4)).toBe(10);
    expect(getNextThumbnailPage('Tab', 2, 10, 4)).toBeNull();
  });

  it('fits at least one thumbnail per view', () => {
    expect(getThumbnailsPerView(600, 160)).toBe(3);
    expect(getThumbnailsPerView(100, 160)).toBe(1);
    expect(getThumbnailsPerView(600, 0)).toBe(600);
  });
});
