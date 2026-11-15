import { useMemo, useRef } from 'react';
import { useIsomorphicEffect } from '@mantine/hooks';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import type { ControllerImplementation, DocViewerEvents } from '../hooks/use-controller-registry';
import type { DocViewerType } from '../utils/get-doc-viewer-type';

type RootEvents = Omit<DocViewerEvents, 'onDocumentLoadStart' | 'onSpreadChange'>;

interface DocViewerEventsInput {
  props: RootEvents;
  src: string;
  type: DocViewerType;
  unsupported: boolean;
  store: DocViewerStore;
  controller: React.RefObject<ControllerImplementation>;
}

/** Handlers that write what they report into the store, then call the latest props */
function createEvents(
  store: DocViewerStore,
  controller: React.RefObject<ControllerImplementation>,
  latest: React.RefObject<DocViewerEventsInput>
): Required<DocViewerEvents> {
  const update = (state: Parameters<typeof updateDocViewerStateAction>[0]) =>
    updateDocViewerStateAction(state, store);
  const props = () => latest.current.props;

  return {
    onDocumentLoadStart: () =>
      update({
        type: latest.current.type,
        status: latest.current.unsupported ? 'unsupported' : 'loading',
        info: null,
        error: null,
        numPages: 0,
        canPrint: false,
      }),
    onDocumentLoad: (info) => {
      const canPrint = controller.current.isPrintable?.() ?? false;
      update({ status: 'ready', info, numPages: info.numPages ?? 0, canPrint });
      props().onDocumentLoad?.(info);
    },
    onDocumentError: (error) => {
      update({ status: 'error', error });
      props().onDocumentError?.(error);
    },
    onPageChange: (page) => {
      update({ page });
      props().onPageChange?.(page);
    },
    onSpreadChange: (index, pages) => update({ spread: { index, pages } }),
    onZoomChange: (zoom, details) => {
      update({ zoom, scale: details.scale });
      props().onZoomChange?.(zoom, details);
    },
    onPageLayoutChange: (layout) => {
      update({ pageLayout: layout });
      props().onPageLayoutChange?.(layout);
    },
    onReadingProgress: (progress) => props().onReadingProgress?.(progress),
    onReachEnd: () => props().onReachEnd?.(),
    onLinkClick: (url, event) => props().onLinkClick?.(url, event),
    onTextSelect: (text, details) => props().onTextSelect?.(text, details),
  };
}

/** Stable event handlers for the views; each also writes what it reports into the store */
export function useDocViewerEvents(input: DocViewerEventsInput) {
  const latest = useRef(input);
  latest.current = input;
  const { store, controller, type, src } = input;
  const events = useMemo(() => createEvents(store, controller, latest), [store, controller]);

  useIsomorphicEffect(() => {
    events.onDocumentLoadStart({ type, src });
  }, [type, src, events]);

  return events;
}
