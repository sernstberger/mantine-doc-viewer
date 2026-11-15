import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import type { DocViewerType } from '../utils/get-doc-viewer-type';

export const PDF_ONLY: readonly DocViewerType[] = ['pdf'];
export const PDF_OR_IMAGE: readonly DocViewerType[] = ['pdf', 'image'];

/** Whether the document is shown and is one of `types`: controls render nothing otherwise */
export function useReadyDocument(types: readonly DocViewerType[]) {
  const { store } = useDocViewerContext();
  return useDocViewerState(
    store,
    (state) => state.status === 'ready' && types.includes(state.type)
  );
}
