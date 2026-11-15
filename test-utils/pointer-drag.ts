import { act, fireEvent } from '@testing-library/react';

export type TestLayout = 'grid' | 'vertical' | 'horizontal';

/** Size of every item and of the list in the fake layout */
export const ITEM = { width: 100, height: 130, gap: 20 };
export const LIST = { width: 1000, height: 800 };
const PER_ROW = 3;

/**
 * Gives `[data-reorder-item]` elements boxes as if laid out in a grid (3 per row), a vertical
 * rail or a horizontal strip (mirrored with `rtl`), and every other element the list's box. jsdom has no layout
 */
export function mockItemLayout(layout: TestLayout, rtl = false) {
  return jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      const items = Array.from(this.parentElement?.querySelectorAll('[data-reorder-item]') ?? []);
      const index = this.hasAttribute('data-reorder-item') ? items.indexOf(this) : -1;
      if (index === -1) {
        return { left: 0, top: 0, right: LIST.width, bottom: LIST.height } as DOMRect;
      }
      const column = layout === 'grid' ? index % PER_ROW : layout === 'horizontal' ? index : 0;
      const row =
        layout === 'grid' ? Math.floor(index / PER_ROW) : layout === 'vertical' ? index : 0;
      // Right to left: the first column is on the right
      const left = rtl
        ? LIST.width - 100 - ITEM.width - column * (ITEM.width + ITEM.gap)
        : 100 + column * (ITEM.width + ITEM.gap);
      const top = 100 + row * (ITEM.height + ITEM.gap);
      return { left, top, right: left + ITEM.width, bottom: top + ITEM.height } as DOMRect;
    });
}

/** Middle of an item's fake box */
export function centerOf(element: Element): [number, number] {
  const rect = element.getBoundingClientRect();
  return [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2];
}

interface DragOptions {
  pointerType?: 'mouse' | 'touch' | 'pen';
  /** Points the pointer moves through, ending where it is released */
  path: [number, number][];
  /** End with pointercancel instead of pointerup */
  cancel?: boolean;
  /** Leave the pointer pressed, to look at the state mid-drag */
  hold?: boolean;
}

/** Presses on `target`, moves along `path` and releases, as Mantine's useDrag expects */
export function pointerDrag(
  target: Element,
  { pointerType = 'mouse', path, cancel, hold }: DragOptions
) {
  const [startX, startY] = centerOf(target);
  const init = (x: number, y: number) => ({
    pointerId: 1,
    pointerType,
    button: 0,
    buttons: 1,
    clientX: x,
    clientY: y,
  });

  act(() => {
    fireEvent.pointerDown(target, init(startX, startY));
  });
  path.forEach(([x, y]) =>
    act(() => {
      fireEvent.pointerMove(document, init(x, y));
    })
  );
  if (hold) {
    return () => release(path[path.length - 1]);
  }
  release(path[path.length - 1]);
  return () => {};

  function release([x, y]: [number, number]) {
    act(() => {
      cancel
        ? fireEvent.pointerCancel(document, init(x, y))
        : fireEvent.pointerUp(document, init(x, y));
    });
  }
}
