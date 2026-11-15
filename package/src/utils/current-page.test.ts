import {
  collectVisibleBoxes,
  getScrollTarget,
  getViewBox,
  getWindowScrollView,
  resolveOffset,
} from './current-page';

const rectOf = (top: number) => ({ top, bottom: top + 10, left: 1, right: 2 });
const nodeAt = (top: number) =>
  ({ getBoundingClientRect: () => rectOf(top) }) as unknown as HTMLElement;

describe('collectVisibleBoxes', () => {
  it('measures the visible pages and skips pages without an element', () => {
    const pages = new Map([[2, nodeAt(5)]]);
    expect(collectVisibleBoxes(new Set([2, 3]), pages)).toEqual([
      { page: 2, top: 5, bottom: 15, left: 1, right: 2 },
    ]);
  });
});

describe('getViewBox', () => {
  it('is the window with a viewport, else the scroll area', () => {
    const root = nodeAt(7);
    expect(getViewBox(true, root)).toEqual({
      top: 0,
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth,
    });
    expect(getViewBox(false, root)).toEqual(rectOf(7));
  });
});

describe('getWindowScrollView', () => {
  it('reads the window', () => {
    expect(getWindowScrollView()).toEqual({
      scrollTop: window.scrollY,
      scrollLeft: window.scrollX,
      clientHeight: window.innerHeight,
      clientWidth: window.innerWidth,
    });
  });
});

describe('resolveOffset', () => {
  it('passes a number through and calls a function with the height', () => {
    expect(resolveOffset(4, 100)).toBe(4);
    expect(resolveOffset((h) => h / 2, 100)).toBe(50);
  });
});

describe('getScrollTarget', () => {
  const view = { scrollTop: 0, scrollLeft: 30, clientHeight: 100, clientWidth: 100 };
  const base = { pageTop: 212, pageLeft: 512, distance: 8, horizontal: false, viewport: false };

  it('leaves room above the page and keeps the horizontal scroll', () => {
    expect(getScrollTarget({ ...base, view })).toEqual({
      top: 208,
      left: 30,
      pageLeft: 500,
      far: false,
    });
  });

  it('scrolls sideways for a row of pages, but not for the window', () => {
    expect(getScrollTarget({ ...base, horizontal: true, view }).left).toBe(500);
    expect(getScrollTarget({ ...base, horizontal: true, viewport: true, view }).left).toBe(30);
  });

  it('is far past three screens in either direction', () => {
    expect(getScrollTarget({ ...base, pageTop: 400, view }).far).toBe(true);
    expect(getScrollTarget({ ...base, pageTop: 300, view }).far).toBe(false);
    expect(getScrollTarget({ ...base, horizontal: true, pageLeft: 400, view }).far).toBe(true);
  });
});
