import { useCallback, useMemo } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import type { DocViewerLoadInfo } from '../../doc-viewer.types';

export interface UseDocViewerViewReturnValue {
  /** Reports that the view is ready; `type` and `mimeType` default to the document's own */
  onLoad: (info?: Partial<DocViewerLoadInfo>) => void;

  /** Reports that the view could not be shown */
  onError: (error: Error) => void;
}

/**
 * Lets a custom view report its outcome: `onLoad` sets the store `status` to `'ready'`, fills
 * `info` and calls Root's `onDocumentLoad`, `onError` sets `'error'` and calls `onDocumentError`.
 * The built-in views do this themselves, a view passed as children has to call it
 */
export function useDocViewerView(): UseDocViewerViewReturnValue {
  const { events, type, mimeType } = useDocViewerContext();

  const onLoad = useCallback(
    (info?: Partial<DocViewerLoadInfo>) =>
      events.onDocumentLoad({ type, ...info, mimeType: info?.mimeType ?? mimeType }),
    [events, type, mimeType]
  );

  return useMemo(() => ({ onLoad, onError: events.onDocumentError }), [onLoad, events]);
}
