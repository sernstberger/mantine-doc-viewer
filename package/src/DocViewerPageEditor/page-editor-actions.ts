import type { DocViewerStore } from '../doc-viewer.store';
import { getExtensionAction } from '../hooks/use-controller-registry';

/** Opens the page editor of the viewer with this store */
export function openPageEditor(store: DocViewerStore) {
  getExtensionAction<() => void>(store, 'editPages')?.();
}

/** Closes the page editor of the viewer with this store without saving */
export function closePageEditor(store: DocViewerStore) {
  getExtensionAction<() => void>(store, 'closePageEditor')?.();
}
