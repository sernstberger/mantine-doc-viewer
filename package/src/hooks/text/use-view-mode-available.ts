import { useEffect } from 'react';
import { updateDocViewerStateAction, type DocViewerStore } from '../../doc-viewer.store';

/** Tells the view mode control whether the view shown has a preview and a source */
export function useViewModeAvailable(store: DocViewerStore, available: boolean) {
  useEffect(() => {
    updateDocViewerStateAction({ viewModeAvailable: available }, store);
    return () => updateDocViewerStateAction({ viewModeAvailable: false }, store);
  }, [store, available]);
}
