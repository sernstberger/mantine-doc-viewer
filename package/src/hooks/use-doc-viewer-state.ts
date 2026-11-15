import { useCallback, useSyncExternalStore } from 'react';
import {
  updateDocViewerStateAction,
  type DocViewerState,
  type DocViewerStore,
} from '../doc-viewer.store';

/**
 * A slice of the store state: the component renders again only when the slice changes. Selectors
 * return primitives, or objects the store keeps while they are the same
 */
export function useDocViewerState<T>(store: DocViewerStore, select: (state: DocViewerState) => T) {
  const getSnapshot = () => select(store.getState());
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** One field of the store state as a `useState` pair, for state the store is the source of */
export function useDocViewerStateValue<K extends keyof DocViewerState>(
  store: DocViewerStore,
  key: K
) {
  const value = useDocViewerState(store, (state) => state[key]);
  const setValue = useCallback(
    (next: DocViewerState[K] | ((current: DocViewerState[K]) => DocViewerState[K])) => {
      const current = store.getState()[key];
      const resolved =
        typeof next === 'function'
          ? (next as (current: DocViewerState[K]) => DocViewerState[K])(current)
          : next;
      resolved !== current && updateDocViewerStateAction({ [key]: resolved }, store);
    },
    [store, key]
  );
  return [value, setValue] as const;
}
