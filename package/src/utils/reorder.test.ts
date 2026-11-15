import { getDropIndex, getMoveIndex, isNoopDrop, ItemRect } from './reorder';

const box = (left: number, top: number, width = 100, height = 100): ItemRect => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

describe('getDropIndex', () => {
  it('has no drop place without items', () => {
    expect(getDropIndex([], [0, 0], 'grid')).toBeNull();
  });

  it('drops before the first item whose middle is past the pointer in a rail', () => {
    const rail = [box(0, 0), box(0, 120), box(0, 240)];
    expect(getDropIndex(rail, [50, 10], 'vertical')).toBe(0);
    expect(getDropIndex(rail, [50, 100], 'vertical')).toBe(1);
    expect(getDropIndex(rail, [50, 400], 'vertical')).toBe(3);
  });

  it('uses the horizontal middle in a strip', () => {
    const strip = [box(0, 0), box(120, 0), box(240, 0)];
    expect(getDropIndex(strip, [100, 50], 'horizontal')).toBe(1);
    expect(getDropIndex(strip, [500, 50], 'horizontal')).toBe(3);
  });

  it('finds the row under the pointer in a wrapping grid, with items of different heights', () => {
    // Two rows of two; the second item of the first row is a taller (portrait) page
    const grid = [box(0, 0), box(120, 0, 100, 160), box(0, 180), box(120, 180)];
    expect(getDropIndex(grid, [10, 50], 'grid')).toBe(0);
    expect(getDropIndex(grid, [80, 150], 'grid')).toBe(1);
    expect(getDropIndex(grid, [300, 150], 'grid')).toBe(2);
    expect(getDropIndex(grid, [190, 200], 'grid')).toBe(4);
    // Below the last row: that row
    expect(getDropIndex(grid, [10, 900], 'grid')).toBe(2);
  });
});

describe('getDropIndex in right-to-left lists', () => {
  it('uses the right half as the "before" side in a strip, whose first item is the rightmost', () => {
    const strip = [box(240, 0), box(120, 0), box(0, 0)];
    expect(getDropIndex(strip, [390, 50], 'horizontal', true)).toBe(0);
    expect(getDropIndex(strip, [250, 50], 'horizontal', true)).toBe(1);
    expect(getDropIndex(strip, [-20, 50], 'horizontal', true)).toBe(3);
    // The left-to-right reading of the same boxes is the mirror image
    expect(getDropIndex(strip, [250, 50], 'horizontal')).toBe(0);
  });

  it('finds the place in a row of a wrapping grid from the right', () => {
    const grid = [box(120, 0), box(0, 0), box(120, 120), box(0, 120)];
    expect(getDropIndex(grid, [210, 50], 'grid', true)).toBe(0);
    expect(getDropIndex(grid, [110, 50], 'grid', true)).toBe(1);
    expect(getDropIndex(grid, [-50, 50], 'grid', true)).toBe(2);
    expect(getDropIndex(grid, [10, 170], 'grid', true)).toBe(4);
  });

  it('does not change a vertical rail', () => {
    const rail = [box(0, 0), box(0, 120)];
    expect(getDropIndex(rail, [50, 10], 'vertical', true)).toBe(0);
    expect(getDropIndex(rail, [50, 100], 'vertical', true)).toBe(1);
  });
});

describe('getMoveIndex and isNoopDrop', () => {
  it('accounts for the item leaving its old place', () => {
    expect(getMoveIndex(0, 3)).toBe(2);
    expect(getMoveIndex(3, 0)).toBe(0);
  });

  it('knows a drop next to the item changes nothing', () => {
    expect(isNoopDrop(2, 2)).toBe(true);
    expect(isNoopDrop(2, 3)).toBe(true);
    expect(isNoopDrop(2, 4)).toBe(false);
    expect(isNoopDrop(2, 1)).toBe(false);
  });
});
