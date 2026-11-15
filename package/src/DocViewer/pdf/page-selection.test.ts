import { clickSelection, toggleSelection, turnPages } from './page-selection';

describe('page selection', () => {
  it('toggles a page in and out without changing the original', () => {
    const start = new Set([1]);
    expect([...toggleSelection(start, 2)]).toEqual([1, 2]);
    expect([...toggleSelection(start, 1)]).toEqual([]);
    expect([...start]).toEqual([1]);
  });

  it('selects only the clicked page, and clears when it was the only one', () => {
    expect([...clickSelection(new Set([1, 2]), 1)]).toEqual([1]);
    expect([...clickSelection(new Set([3]), 1)]).toEqual([1]);
    expect([...clickSelection(new Set([1]), 1)]).toEqual([]);
  });

  it('turns pages a quarter clockwise, wrapping at a full turn', () => {
    const once = turnPages({}, [1, 2]);
    expect(once).toEqual({ 1: 90, 2: 90 });
    expect(turnPages({ ...once, 1: 270 }, new Set([1]))).toEqual({ 1: 0, 2: 90 });
  });
});
