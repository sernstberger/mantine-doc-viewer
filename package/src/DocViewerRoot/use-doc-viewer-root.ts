import { use, useEffect, useState } from 'react';
import {
  getEnv,
  getSpacing,
  getThemeColor,
  MantineColor,
  rem,
  useMantineTheme,
  type GetStylesApi,
} from '@mantine/core';
import { useIsomorphicEffect } from '@mantine/hooks';
import {
  createDocViewerStore,
  updateDocViewerStateAction,
  type DocViewerStore,
} from '../doc-viewer.store';
import type { DocViewerExtension } from '../doc-viewer.types';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerLabels } from '../default-labels';
import { useDocViewerContextValue } from './doc-viewer-context-value';
import type { DocViewerRootFactory, DocViewerRootProps } from './DocViewerRoot';
import { DocViewerLayoutContext, type DocViewerLayoutConfig } from './layout-context';
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
        "[mantine-doc-viewer] PDF files need DocViewerAdapterProvider with createPdfJsAdapter: <DocViewerAdapterProvider pdf={createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc })}>"
      );
    }
  }, [missing]);
}

/** Labels the extensions bring, from the `labels` option each of them takes */
function getExtensionLabels(extensions: DocViewerExtension[] | undefined) {
  return (extensions ?? []).map(
    (extension) => (extension.options as { labels?: Partial<DocViewerLabels> } | undefined)?.labels
  );
}

/** CSS variables of the parts, from the part props `DocViewer` passes through */
function usePartVars(layout: DocViewerLayoutConfig) {
  const theme = useMantineTheme();
  const { pagesProps, thumbnailsProps } = layout;
  const color = (value: MantineColor | undefined) =>
    value ? getThemeColor(value, theme) : undefined;
  return {
    '--doc-viewer-page-gap': pagesProps?.gap === undefined ? undefined : getSpacing(pagesProps.gap),
    '--doc-viewer-match-color': color(pagesProps?.matchColor),
    '--doc-viewer-active-match-color': color(pagesProps?.activeMatchColor),
    '--doc-viewer-thumbnails-width': thumbnailsProps?.width
      ? rem(thumbnailsProps.width)
      : undefined,
  };
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
    extensionLabels: getExtensionLabels(props.extensions),
    toggleOnTap: layout.toolbarProps?.toggleOnTap,
    fullscreen: props.fullscreen,
    onFullscreenChange: (value) => {
      updateDocViewerStateAction({ fullscreen: value }, store);
      props.onFullscreenChange?.(value);
    },
    ref: props.ref,
    store,
  });
  const events = useDocViewerEvents({
    props: { ...props, ...layout.pagesProps },
    src: props.src,
    type: session.type,
    unsupported: session.type === 'unknown' || (session.type === 'pdf' && !adapters.pdf),
    store,
    controller: session.controller,
  });
  useThumbnailsDefaults(props, store, session.type);
  useMissingPdfAdapterWarning(session.type === 'pdf' && !adapters.pdf);

  const partVars = usePartVars(layout);
  const value = useDocViewerContextValue({
    props,
    layout,
    getStyles,
    session,
    events,
    store,
    adapters,
  });

  return { value, session, partVars, withPdfSession: session.type === 'pdf' && !!adapters.pdf };
}
