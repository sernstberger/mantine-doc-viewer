/** Whether the node lays out from right to left, where browsers count `scrollLeft` from 0 down to a negative number */
export function isRightToLeft(node: HTMLElement) {
  return getComputedStyle(node).direction === 'rtl';
}

/** How far the node is scrolled from its left edge, the same in left-to-right and right-to-left layouts */
export function getScrollLeft(node: HTMLElement) {
  return isRightToLeft(node)
    ? node.scrollLeft + node.scrollWidth - node.clientWidth
    : node.scrollLeft;
}

/** Scrolls the node so that `left` is the distance from its left edge, whatever the direction */
export function setScrollLeft(node: HTMLElement, left: number) {
  node.scrollLeft = isRightToLeft(node) ? left - (node.scrollWidth - node.clientWidth) : left;
}

/** How far the node is scrolled from where reading starts: its left edge, or its right edge in a right-to-left layout */
export function getScrollStart(node: HTMLElement) {
  return isRightToLeft(node) ? Math.abs(node.scrollLeft) : node.scrollLeft;
}
