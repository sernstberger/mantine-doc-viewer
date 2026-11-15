/** How the items being reordered are laid out */
export type ReorderLayout = 'grid' | 'vertical' | 'horizontal';

export interface ItemRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where a dragged item would be inserted, as an index into the current list (0 is before the
 * first item, `rects.length` after the last), from the pointer position and the items' boxes.
 * With `rtl`, items in a row run from right to left: the first one is the rightmost
 */
export function getDropIndex(
  rects: ItemRect[],
  [x, y]: [number, number],
  layout: ReorderLayout,
  rtl = false
): number | null {
  // True when the pointer is before the middle of the item, in reading order across the row
  const beforeMiddle = ({ left, right }: ItemRect) =>
    rtl ? x > (left + right) / 2 : x < (left + right) / 2;

  if (rects.length === 0) {
    return null;
  }

  if (layout === 'vertical' || layout === 'horizontal') {
    const vertical = layout === 'vertical';
    const pointer = vertical ? y : x;
    const index = rects.findIndex((rect) =>
      vertical ? pointer < (rect.top + rect.bottom) / 2 : beforeMiddle(rect)
    );
    return index === -1 ? rects.length : index;
  }

  // A wrapping grid: the row under the pointer (or the nearest row), then the place in that row.
  // Items in a row share their top edge; their heights can differ
  const rows: { first: number; items: ItemRect[]; bottom: number }[] = [];
  rects.forEach((rect, index) => {
    const row = rows.find((item) => item.items[0].top === rect.top);
    if (row) {
      row.items.push(rect);
      row.bottom = Math.max(row.bottom, rect.bottom);
    } else {
      rows.push({ first: index, items: [rect], bottom: rect.bottom });
    }
  });
  const row = rows.find((item) => y <= item.bottom) ?? rows[rows.length - 1];
  const inRow = row.items.findIndex(beforeMiddle);
  return row.first + (inRow === -1 ? row.items.length : inRow);
}

/** Index to move an item to, once it is taken out of the list, for a drop at `dropIndex` */
export function getMoveIndex(fromIndex: number, dropIndex: number) {
  return dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
}

/** True when dropping at `dropIndex` would leave the item where it is */
export function isNoopDrop(fromIndex: number, dropIndex: number) {
  return dropIndex === fromIndex || dropIndex === fromIndex + 1;
}
