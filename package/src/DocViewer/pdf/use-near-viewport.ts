import { useEffect, useRef, useState } from 'react';

/**
 * True while the element is within `rootMargin` of the scroll root. It turns false again
 * once the element is further away, so long documents only keep the pages around the view
 * drawn: a 1000 page PDF would otherwise hold a canvas for every page it scrolled past
 */
export function useNearViewport<T extends HTMLElement>(
  root: HTMLElement | null,
  rootMargin = '200% 0px'
) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => setNear(entries[entries.length - 1].isIntersecting),
      { root, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [root, rootMargin]);

  return { ref, near };
}
