import { useEffect, useRef, useState } from 'react';

/** Becomes true once the element comes within `rootMargin` of the scroll root, and stays true */
export function useNearViewport<T extends HTMLElement>(
  root: HTMLElement | null,
  rootMargin = '200% 0px'
) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near || !ref.current) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.some((entry) => entry.isIntersecting) && setNear(true),
      { root, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [root, rootMargin, near]);

  return { ref, near };
}
