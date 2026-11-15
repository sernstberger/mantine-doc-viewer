import type { DocViewerMark } from './markup';
import { groupMarksByPage } from './marks-by-page';

const mark = (id: string, page: number): DocViewerMark => ({
  type: 'highlight',
  id,
  page,
  color: 'yellow',
  rect: { x: 0, y: 0, width: 10, height: 10 },
});

describe('groupMarksByPage', () => {
  const a = mark('a', 1);
  const b = mark('b', 2);
  const c = mark('c', 1);

  it('groups the marks by page, in the order they were made', () => {
    const groups = groupMarksByPage([a, b, c]);
    expect(groups.get(1)).toEqual([a, c]);
    expect(groups.get(2)).toEqual([b]);
    expect(groups.get(3)).toBeUndefined();
  });

  it('keeps the array of each page whose marks did not change', () => {
    const before = groupMarksByPage([a, b]);
    const after = groupMarksByPage([a, b, c], before);
    expect(after.get(2)).toBe(before.get(2));
    expect(after.get(1)).not.toBe(before.get(1));
    expect(after.get(1)).toEqual([a, c]);
  });

  it('gives a page a new array when a mark on it is replaced', () => {
    const before = groupMarksByPage([a, b]);
    const moved = { ...a };
    const after = groupMarksByPage([moved, b], before);
    expect(after.get(1)).toEqual([moved]);
    expect(after.get(1)).not.toBe(before.get(1));
  });
});
