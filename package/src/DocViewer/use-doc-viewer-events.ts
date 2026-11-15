import { useMemo } from 'react';
import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import type { DocViewerType } from './detect-doc-type';
import type { DocViewerProps } from './DocViewer';

/** Stable event handlers for the views, and the load-start report */
export function useDocViewerEvents(
  props: Pick<
    DocViewerProps,
    | 'src'
    | 'onDocumentLoadStart'
    | 'onDocumentLoad'
    | 'onDocumentError'
    | 'onPageChange'
    | 'onSpreadChange'
    | 'onZoomChange'
    | 'onPageLayoutChange'
    | 'onReadingProgress'
    | 'onReachEnd'
    | 'onLinkClick'
    | 'onTextSelect'
  >,
  type: DocViewerType
) {
  // Stable, so views can call them from effects without re-running them
  const handleDocumentLoadStart = useCallbackRef(props.onDocumentLoadStart);
  const handleDocumentLoad = useCallbackRef(props.onDocumentLoad);
  const handleDocumentError = useCallbackRef(props.onDocumentError);
  const handlePageChange = useCallbackRef(props.onPageChange);
  const handleSpreadChange = useCallbackRef(props.onSpreadChange);
  const handleZoomChange = useCallbackRef(props.onZoomChange);
  const handlePageLayoutChange = useCallbackRef(props.onPageLayoutChange);
  const handleReadingProgress = useCallbackRef(props.onReadingProgress);
  const handleReachEnd = useCallbackRef(props.onReachEnd);
  const handleLinkClick = useCallbackRef(props.onLinkClick);
  const handleTextSelect = useCallbackRef(props.onTextSelect);
  const events = useMemo(
    () => ({
      onDocumentLoadStart: handleDocumentLoadStart,
      onDocumentLoad: handleDocumentLoad,
      onDocumentError: handleDocumentError,
      onPageChange: handlePageChange,
      onSpreadChange: handleSpreadChange,
      onZoomChange: handleZoomChange,
      onPageLayoutChange: handlePageLayoutChange,
      onReadingProgress: handleReadingProgress,
      onReachEnd: handleReachEnd,
      onLinkClick: handleLinkClick,
      onTextSelect: handleTextSelect,
    }),
    [
      handleDocumentLoadStart,
      handleDocumentLoad,
      handleDocumentError,
      handlePageChange,
      handleZoomChange,
      handlePageLayoutChange,
      handleLinkClick,
      handleTextSelect,
      handleReadingProgress,
      handleReachEnd,
      handleSpreadChange,
    ]
  );

  // A layout effect, so the start is reported before any view reports that it loaded
  const { src } = props;
  useIsomorphicEffect(() => {
    handleDocumentLoadStart({ type, src });
  }, [type, src, handleDocumentLoadStart]);

  return events;
}
