import { use, useEffect, useState } from 'react';
import { getEnv, type GetStylesApi } from '@mantine/core';
import { useIsomorphicEffect } from '@mantine/hooks';
import {
  createDocViewerStore,
  updateDocViewerStateAction,
  type DocViewerStore,
} from '../doc-viewer.store';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { useDocViewerContextValue } from './doc-viewer-context-value';
import type { DocViewerRootFactory, DocViewerRootProps } from './DocViewerRoot';
import { DocViewerLayoutContext } from './layout-context';
import { useDocViewerEvents } from './use-doc-viewer-events';
import { useDocViewerSession } from './use-doc-viewer-session';

const storeOwners = new WeakMap<DocViewerStore, object>();

/** In development, throws when a second mounted Root is given a store another Root already uses */
function useStoreOwner(store: DocViewerStore) {
  const [owner] = useState(() => ({}));
  useEffect(() => {
    if (getEnv() === 'development' && storeOwners.has(store)) {
      throw new Error(
        '[mantine-doc-viewer] One store is passed to two DocViewer.Root components. Create a store for each viewer with useDocViewer()'
      );
    }
    storeOwners.set(store, owner);
    return () => {
      storeOwners.get(store) === owner && storeOwners.delete(store);
    };
  }, [store, owner]);
}

let warnedMissingPdfAdapter = false;

/** Forgets that the missing PDF adapter warning was shown, for tests */
export function resetMissingPdfAdapterWarning() {
  warnedMissingPdfAdapter = false;
}

/** In development, warns once when a PDF is shown without a PDF adapter */
function useMissingPdfAdapterWarning(missing: boolean) {
  useEffect(() => {
    if (missing && getEnv() === 'development' && !warnedMissingPdfAdapter) {
      warnedMissingPdfAdapter = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[mantine-doc-viewer] PDF files need DocViewerAdapterProvider with createPdfJsAdapter: <DocViewerAdapterProvider pdf={createPdfJsAdapter(loadPdfJs, { workerSrc })}>, where loadPdfJs is a function that imports pdfjs-dist'
      );
    }
  }, [missing]);
}

/** Opens the thumbnails as `defaultThumbnails*` say, when a viewer mounts and for each new document */
function useThumbnailsDefaults(props: DocViewerRootProps, store: DocViewerStore, type: string) {
  const documentKey = props.keepView ? type : `${type}:${props.src}`;
  useIsomorphicEffect(() => {
    updateDocViewerStateAction(
      {
        thumbnailsOpened: !!props.defaultThumbnailsOpened,
        thumbnailsPosition: props.defaultThumbnailsPosition ?? 'left',
      },
      store
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey, store]);
}

/** Everything Root wires: the store, session, events and context value of one viewer */
export function useDocViewerRoot(
  props: DocViewerRootProps,
  getStyles: GetStylesApi<DocViewerRootFactory>
) {
  const layout = use(DocViewerLayoutContext);
  const adapters = useDocViewerAdapters();
  const [ownStore] = useState(createDocViewerStore);
  const store = props.store ?? ownStore;
  useStoreOwner(store);

  const session = useDocViewerSession({
    src: props.src,
    type: props.type,
    mimeType: props.mimeType,
    fileName: props.fileName,
    labels: props.labels,
    fullscreen: props.fullscreen,
    onFullscreenChange: (value) => {
      updateDocViewerStateAction({ fullscreen: value }, store);
      props.onFullscreenChange?.(value);
    },
    ref: props.ref,
    store,
  });
  const events = useDocViewerEvents({
    props,
    src: props.src,
    type: session.type,
    unsupported: session.type === 'unknown' || (session.type === 'pdf' && !adapters.pdf),
    store,
    controller: session.controller,
  });
  useThumbnailsDefaults(props, store, session.type);
  useMissingPdfAdapterWarning(session.type === 'pdf' && !adapters.pdf);

  const value = useDocViewerContextValue({
    props,
    layout,
    getStyles,
    session,
    events,
    store,
    adapters,
  });

  return { value, session, withPdfSession: session.type === 'pdf' && !!adapters.pdf };
}
