import { useEffect, useRef, useState } from 'react';

type NearListener = (near: boolean) => void;

interface SharedObserver {
  observer: IntersectionObserver;
  listeners: Map<Element, NearListener>;
}

/** Key for the window as the root, which a WeakMap cannot take as `null` */
const VIEWPORT = {};

/** One observer per root and margin: a 1000 page PDF would otherwise create one per page and thumbnail */
const observers = new WeakMap<object, Map<string, SharedObserver>>();

function getSharedObserver(root: HTMLElement | null, rootMargin: string) {
  const key = root ?? VIEWPORT;
  const byMargin = observers.get(key) ?? new Map<string, SharedObserver>();
  observers.set(key, byMargin);

  let shared = byMargin.get(rootMargin);
  if (!shared) {
    const listeners = new Map<Element, NearListener>();
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => listeners.get(entry.target)?.(entry.isIntersecting)),
      { root, rootMargin }
    );
    shared = { observer, listeners };
    byMargin.set(rootMargin, shared);
  }
  return { shared, byMargin };
}

/** Watches `element` with the shared observer for its root and margin; returns the function that stops */
function observeNear(
  element: Element,
  root: HTMLElement | null,
  rootMargin: string,
  listener: NearListener
) {
  const { shared, byMargin } = getSharedObserver(root, rootMargin);
  shared.listeners.set(element, listener);
  shared.observer.observe(element);

  return () => {
    shared.listeners.delete(element);
    shared.observer.unobserve(element);
    if (shared.listeners.size === 0) {
      shared.observer.disconnect();
      byMargin.delete(rootMargin);
    }
  };
}

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

    return observeNear(ref.current, root, rootMargin, setNear);
  }, [root, rootMargin]);

  return { ref, near };
}
