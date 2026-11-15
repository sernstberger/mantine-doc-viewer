import type { DocViewerStore } from '../doc-viewer.store';
import { getExtensionAction } from '../hooks/use-controller-registry';
import type { DocViewerMarkupTool } from './utils/markup';

/** Picks the markup tool of the viewer with this store, or puts it down with `null` */
export function setMarkupTool(tool: DocViewerMarkupTool | null, store: DocViewerStore) {
  getExtensionAction<(tool: DocViewerMarkupTool | null) => void>(store, 'setMarkupTool')?.(tool);
}

/** Writes the marks into the PDF and hands the bytes to `onDocumentChange`, or downloads them */
export async function saveMarkup(store: DocViewerStore) {
  await getExtensionAction<() => Promise<void>>(store, 'saveMarkup')?.();
}
