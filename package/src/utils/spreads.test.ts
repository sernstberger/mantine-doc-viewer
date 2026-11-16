import {
  fitsAcross,
  getSpreadIndex,
  getNextPage,
  getSpreads,
  getSwipeDirection,
  getTapDirection,
  getTurnKeyDirection,
  getTurnTarget,
  resolvePageTurning,
} from './spreads';

describe('getSpreads', () => {
  it('pairs pages in the two-page layout', () => {
    expect(getSpreads('two-page', 5)).toEqual([[1, 2], [3, 4], [5]]);
    expect(getSpreads('two-page', 4)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('keeps the cover on its own in the two-page-cover layout', () => {
    expect(getSpreads('two-page-cover', 5)).toEqual([[1], [2, 3], [4, 5]]);
    expect(getSpreads('two-page-cover', 4)).toEqual([[1], [2, 3], [4]]);
    expect(getSpreads('two-page-cover', 0)).toEqual([]);
  });

  it('has one page per spread in other layouts', () => {
    expect(getSpreads('single', 3)).toEqual([[1], [2], [3]]);
    expect(getSpreads('wrapped', 2)).toEqual([[1], [2]]);
  });
});

describe('turning', () => {
  const spreads = getSpreads('two-page-cover', 6);

  it('finds the spread a page is on', () => {
    expect(getSpreadIndex(spreads, 1)).toBe(0);
    expect(getSpreadIndex(spreads, 3)).toBe(1);
    expect(getSpreadIndex(spreads, 6)).toBe(3);
    expect(getSpreadIndex([], 1)).toBe(0);
  });

  it('turns to the first page of the next or previous spread, and stops at the ends', () => {
    expect(getTurnTarget(spreads, 1, 1)).toBe(2);
    expect(getTurnTarget(spreads, 3, 1)).toBe(4);
    expect(getTurnTarget(spreads, 5, -1)).toBe(2);
    expect(getTurnTarget(spreads, 2, -1)).toBe(1);
    expect(getTurnTarget(spreads, 1, -1)).toBeNull();
    expect(getTurnTarget(spreads, 6, 1)).toBeNull();
  });

  it('turns back from the left edge and forward from the right edge', () => {
    expect(getTapDirection(110, 100, 400)).toBe(-1);
    expect(getTapDirection(300, 100, 400)).toBeNull();
    expect(getTapDirection(490, 100, 400)).toBe(1);
  });

  it('turns forward for a swipe to the left, like paper', () => {
    expect(getSwipeDirection([-80, 10])).toBe(1);
    expect(getSwipeDirection([80, -10])).toBe(-1);
    expect(getSwipeDirection([20, 0])).toBeNull();
    expect(getSwipeDirection([80, 60])).toBeNull();
  });
});

describe('getTurnKeyDirection', () => {
  const key = (init: KeyboardEventInit, target: Element = document.body) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    Object.defineProperty(event, 'target', { value: target });
    return event;
  };

  it('turns with the arrow and page keys pedals send', () => {
    expect(getTurnKeyDirection(key({ key: 'ArrowRight' }))).toBe(1);
    expect(getTurnKeyDirection(key({ key: 'PageDown' }))).toBe(1);
    expect(getTurnKeyDirection(key({ key: 'ArrowLeft' }))).toBe(-1);
    expect(getTurnKeyDirection(key({ key: 'PageUp' }))).toBe(-1);
    expect(getTurnKeyDirection(key({ key: 'ArrowDown' }))).toBeNull();
  });

  it('leaves keys with modifiers, handled keys and keys in fields alone', () => {
    expect(getTurnKeyDirection(key({ key: 'ArrowRight', altKey: true }))).toBeNull();
    expect(getTurnKeyDirection(key({ key: 'ArrowRight', shiftKey: true }))).toBeNull();
    const handled = key({ key: 'ArrowRight' });
    handled.preventDefault();
    expect(getTurnKeyDirection(handled)).toBeNull();

    const input = document.createElement('input');
    expect(getTurnKeyDirection(key({ key: 'ArrowLeft' }, input))).toBeNull();
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    const item = menu.appendChild(document.createElement('button'));
    expect(getTurnKeyDirection(key({ key: 'ArrowLeft' }, item))).toBeNull();
  });

  it.each(['tree', 'grid', 'spinbutton', 'combobox', 'application'])(
    'leaves keys in a %s alone',
    (role) => {
      const widget = document.createElement('div');
      widget.setAttribute('role', role);
      const inner = widget.appendChild(document.createElement('span'));
      expect(getTurnKeyDirection(key({ key: 'ArrowRight' }, inner))).toBeNull();
      expect(getTurnKeyDirection(key({ key: 'PageDown' }, inner))).toBeNull();
    }
  );

  it.each(['toolbar', 'tablist', 'radiogroup', 'menubar'])(
    'leaves the arrows in a %s alone and turns with Page up and Page down',
    (role) => {
      const widget = document.createElement('div');
      widget.setAttribute('role', role);
      const inner = widget.appendChild(document.createElement('span'));
      expect(getTurnKeyDirection(key({ key: 'ArrowRight' }, inner))).toBeNull();
      expect(getTurnKeyDirection(key({ key: 'ArrowLeft' }, inner))).toBeNull();
      expect(getTurnKeyDirection(key({ key: 'PageDown' }, inner))).toBe(1);
      expect(getTurnKeyDirection(key({ key: 'PageUp' }, inner))).toBe(-1);
    }
  );

  it('leaves keys in a video alone', () => {
    expect(
      getTurnKeyDirection(key({ key: 'ArrowRight' }, document.createElement('video')))
    ).toBeNull();
  });
});

describe('resolvePageTurning', () => {
  it('turns everything on for true and leaves out what an object turns off', () => {
    expect(resolvePageTurning(true)).toEqual({ tapZones: true, swipe: true, keys: true });
    expect(resolvePageTurning({ swipe: false })).toEqual({
      tapZones: true,
      swipe: false,
      keys: true,
    });
    expect(resolvePageTurning(false)).toEqual({ tapZones: false, swipe: false, keys: false });
    expect(resolvePageTurning(undefined)).toEqual({ tapZones: false, swipe: false, keys: false });
  });
});

describe('fitsAcross', () => {
  const base = { scale: 1, pageWidth: 400, columnGap: 16, bodyWidth: 900 };

  it('checks a page or a spread against the width of the view', () => {
    expect(fitsAcross({ ...base, layout: 'single' })).toBe(true);
    expect(fitsAcross({ ...base, layout: 'two-page' })).toBe(true);
    expect(fitsAcross({ ...base, layout: 'two-page', scale: 1.2 })).toBe(false);
  });

  it('never lets a swipe turn the horizontal layout, which scrolls sideways', () => {
    expect(fitsAcross({ ...base, layout: 'horizontal' })).toBe(false);
  });
});

describe('getNextPage', () => {
  it('goes one page on, and loops or stops at the end', () => {
    expect(getNextPage(1, 3, 'single', true)).toBe(2);
    expect(getNextPage(3, 3, 'single', true)).toBe(1);
    expect(getNextPage(3, 3, 'wrapped', false)).toBeNull();
  });

  it('turns two-page layouts a spread at a time', () => {
    expect(getNextPage(1, 6, 'two-page', true)).toBe(3);
    expect(getNextPage(2, 6, 'two-page', true)).toBe(3);
    expect(getNextPage(5, 6, 'two-page', true)).toBe(1);

    // With a cover the spreads are 1, 2-3, 4-5
    expect(getNextPage(1, 6, 'two-page-cover', true)).toBe(2);
    expect(getNextPage(2, 6, 'two-page-cover', true)).toBe(4);
    expect(getNextPage(3, 6, 'two-page-cover', true)).toBe(4);
    expect(getNextPage(6, 6, 'two-page-cover', false)).toBeNull();
  });
});
