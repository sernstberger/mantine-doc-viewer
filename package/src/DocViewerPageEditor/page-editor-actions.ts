import type { DocViewerStore } from '../doc-viewer.store';
import { getControllerRegistry } from '../hooks/use-controller-registry';

/** Opens the page editor of the viewer with this store */
export function openPageEditor(store: DocViewerStore) {
  getControllerRegistry(store).current.editPages?.();
}

/** Closes the page editor of the viewer with this store without saving */
export function closePageEditor(store: DocViewerStore) {
  getControllerRegistry(store).current.closePageEditor?.();
}
