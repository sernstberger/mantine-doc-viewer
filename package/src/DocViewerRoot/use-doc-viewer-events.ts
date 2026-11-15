import { useMemo } from 'react';
import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import type { ControllerImplementation, DocViewerEvents } from '../hooks/use-controller-registry';
import type { DocViewerType } from '../utils/get-doc-viewer-type';

interface DocViewerEventsInput {
  props: Omit<DocViewerEvents, 'onDocumentLoadStart' | 'onSpreadChange'>;
  src: string;
  type: DocViewerType;
  unsupported: boolean;
  store: DocViewerStore;
  controller: React.RefObject<ControllerImplementation>;
}

/** Stable event handlers for the views; each also writes what it reports into the store */
export function useDocViewerEvents({
  props,
  src,
  type,
  unsupported,
  store,
  controller,
}: DocViewerEventsInput) {
  const update = (state: Parameters<typeof updateDocViewerStateAction>[0]) =>
    updateDocViewerStateAction(state, store);

  const onDocumentLoadStart = useCallbackRef(() =>
    update({
      type,
      status: unsupported ? 'unsupported' : 'loading',
      info: null,
      error: null,
      numPages: 0,
      canPrint: false,
    })
  );
  const onDocumentLoad = useCallbackRef(
    (info: Parameters<Required<DocViewerEvents>['onDocumentLoad']>[0]) => {
      update({
        status: 'ready',
        info,
        numPages: info.numPages ?? 0,
        canPrint: controller.current.isPrintable?.() ?? false,
      });
      props.onDocumentLoad?.(info);
    }
  );
  const onDocumentError = useCallbackRef((error: Error) => {
    update({ status: 'error', error });
    props.onDocumentError?.(error);
  });
  const onPageChange = useCallbackRef((page: number) => {
    update({ page });
    props.onPageChange?.(page);
  });
  const onSpreadChange = useCallbackRef((index: number, pages: number[]) =>
    update({ spread: { index, pages } })
  );
  const onZoomChange = useCallbackRef<Required<DocViewerEvents>['onZoomChange']>(
    (zoom, details) => {
      update({ zoom, scale: details.scale });
      props.onZoomChange?.(zoom, details);
    }
  );
  const onPageLayoutChange = useCallbackRef<Required<DocViewerEvents>['onPageLayoutChange']>(
    (layout) => {
      update({ pageLayout: layout });
      props.onPageLayoutChange?.(layout);
    }
  );
  const onReadingProgress = useCallbackRef(props.onReadingProgress);
  const onReachEnd = useCallbackRef(props.onReachEnd);
  const onLinkClick = useCallbackRef(props.onLinkClick);
  const onTextSelect = useCallbackRef(props.onTextSelect);

  const events = useMemo<Required<DocViewerEvents>>(
    () => ({
      onDocumentLoadStart,
      onDocumentLoad,
      onDocumentError,
      onPageChange,
      onSpreadChange,
      onZoomChange,
      onPageLayoutChange,
      onReadingProgress,
      onReachEnd,
      onLinkClick,
      onTextSelect,
    }),
    [
      onDocumentLoadStart,
      onDocumentLoad,
      onDocumentError,
      onPageChange,
      onSpreadChange,
      onZoomChange,
      onPageLayoutChange,
      onReadingProgress,
      onReachEnd,
      onLinkClick,
      onTextSelect,
    ]
  );

  useIsomorphicEffect(() => {
    onDocumentLoadStart();
  }, [type, src, onDocumentLoadStart]);

  return events;
}
