import { useEffect, useRef } from 'react';

/**
 * Puts the scroll position back when `src` changes and the new document is ready, for the
 * `keepView` prop. The position is tracked while the document is ready: a document that is
 * loading is shorter, and the browser moves the scroll position to the top
 */
export function useKeepScroll(
  node: HTMLElement | null,
  ready: boolean,
  src: string,
  enabled: boolean | undefined
) {
  const position = useRef({ top: 0, left: 0 });
  const pending = useRef(false);
  const lastSrc = useRef(src);

  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    if (!node || !enabled) {
      return undefined;
    }

    const onScroll = () => {
      if (readyRef.current) {
        position.current = { top: node.scrollTop, left: node.scrollLeft };
      }
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [node, enabled]);

  useEffect(() => {
    if (enabled && src !== lastSrc.current) {
      pending.current = true;
    }
    lastSrc.current = src;
  }, [src, enabled]);

  useEffect(() => {
    if (node && ready && pending.current) {
      pending.current = false;
      node.scrollTop = position.current.top;
      node.scrollLeft = position.current.left;
    }
  }, [node, ready]);
}
