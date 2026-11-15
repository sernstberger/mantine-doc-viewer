import { useCallback, useRef } from 'react';

/** A size, kept as the same object while it does not change, so state setters can skip a render */
export function keepSize<T extends { width: number; height: number }>(
  current: T | null,
  next: T
): T {
  return current && current.width === next.width && current.height === next.height ? current : next;
}

/**
 * A ref for a page canvas that empties the canvas when it is removed. WebKit keeps a removed
 * canvas's pixels (up to 64 MB for a page) until garbage collection; a zero size frees them now,
 * as pdf.js does for its own canvases. `node` is the canvas while it is mounted
 */
export function usePageCanvasRef() {
  const node = useRef<HTMLCanvasElement | null>(null);
  const ref = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas && node.current) {
      node.current.width = 0;
      node.current.height = 0;
    }
    node.current = canvas;
  }, []);

  return { node, ref };
}
