import { useIsomorphicEffect } from '@mantine/hooks';
import { useState, useSyncExternalStore } from 'react';

/**
 * The scale of the pages, kept outside the page props: a memoised page that does not draw
 * anything at the new scale does not render again when the zoom changes
 */
export interface PageScaleStore {
  get: () => number;
  set: (scale: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPageScaleStore(initial: number): PageScaleStore {
  let scale = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => scale,
    set: (next) => {
      if (next !== scale) {
        scale = next;
        listeners.forEach((listener) => listener());
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The store of the page list, set to `scale` once the list has rendered */
export function usePageScaleStore(scale: number) {
  const [store] = useState(() => createPageScaleStore(scale));
  useIsomorphicEffect(() => store.set(scale), [store, scale]);
  return store;
}

/** The scale while `active`, 0 otherwise: a page that is not active renders no more for a zoom */
export function usePageScale(store: PageScaleStore, active: boolean) {
  const read = () => (active ? store.get() : 0);
  return useSyncExternalStore(store.subscribe, read, read);
}
