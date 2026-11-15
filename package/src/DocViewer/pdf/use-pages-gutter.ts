import { useEffect, useState } from 'react';
import { DEFAULT_PAGES_GUTTER, PagesGutter } from './zoom';

/**
 * Space the CSS padding of the pages element takes, so fit-to-width leaves exactly that free:
 * an app's own `pages` class can add room for marks around the pages. Read again when the
 * view is resized, since the padding can change with a media query
 */
export function usePagesGutter(pages: HTMLElement | null, viewWidth: number): PagesGutter {
  const [gutter, setGutter] = useState(DEFAULT_PAGES_GUTTER);

  useEffect(() => {
    if (pages) {
      const style = getComputedStyle(pages);
      const sum = (a: string, b: string, fallback: number) => {
        const total = parseFloat(a) + parseFloat(b);
        return Number.isNaN(total) ? fallback : total;
      };
      const next = {
        x: sum(style.paddingLeft, style.paddingRight, DEFAULT_PAGES_GUTTER.x),
        y: sum(style.paddingTop, style.paddingBottom, DEFAULT_PAGES_GUTTER.y),
      };
      setGutter((current) => (current.x === next.x && current.y === next.y ? current : next));
    }
  }, [pages, viewWidth]);

  return gutter;
}
