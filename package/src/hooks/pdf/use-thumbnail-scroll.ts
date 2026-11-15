import { useEffect, type RefObject } from 'react';

/** Keep the active thumbnail visible, scrolling only the sidebar */
export function useThumbnailScroll(
  ref: RefObject<HTMLElement | null>,
  scrollRoot: HTMLElement | null,
  active: boolean,
  horizontal: boolean
) {
  useEffect(() => {
    const node = ref.current;
    if (!active || !node || !scrollRoot) {
      return;
    }

    if (horizontal) {
      const left = node.offsetLeft;
      const right = left + node.offsetWidth;
      if (left < scrollRoot.scrollLeft || right > scrollRoot.scrollLeft + scrollRoot.clientWidth) {
        scrollRoot.scrollTo({ left: left - scrollRoot.clientWidth / 2 + node.offsetWidth / 2 });
      }
      return;
    }

    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (top < scrollRoot.scrollTop || bottom > scrollRoot.scrollTop + scrollRoot.clientHeight) {
      scrollRoot.scrollTo({ top: top - scrollRoot.clientHeight / 2 + node.offsetHeight / 2 });
    }
  }, [active, scrollRoot, ref, horizontal]);
}
