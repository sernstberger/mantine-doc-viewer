import { use, useState, useSyncExternalStore } from 'react';
import {
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
  type DocViewerState,
  type DocViewerStore,
} from '../doc-viewer.store';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerMarkupOptions } from '../DocViewerMarkup/markup-extension';
import type { DocViewerPageEditorOptions } from '../DocViewerPageEditor/page-editor-extension';
import { getExtensionOptions, useDocViewerContextValue } from './doc-viewer-context-value';
import type { DocViewerRootFactory, DocViewerRootProps } from './DocViewerRoot';
import { DocViewerLayoutContext, type DocViewerLayoutConfig } from './layout-context';
import { useDocViewerEvents } from './use-doc-viewer-events';
import { useDocViewerSession } from './use-doc-viewer-session';

function useStoreSlice<T>(store: DocViewerStore, select: (state: DocViewerState) => T) {
  const getSnapshot = () => select(store.getState());
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
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
  const editor = getExtensionOptions<DocViewerPageEditorOptions>(props.extensions, 'page-editor');
  const markup = getExtensionOptions<DocViewerMarkupOptions>(props.extensions, 'markup');

  const session = useDocViewerSession({
    src: props.src,
    type: props.type,
    mimeType: props.mimeType,
    fileName: props.fileName,
    labels: props.labels,
    extensionLabels: [editor?.labels, markup?.labels],
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

  const thumbnailsOpened = useStoreSlice(store, (state) => state.thumbnailsOpened);
  const thumbnailsPosition = useStoreSlice(store, (state) => state.thumbnailsPosition);
  const partVars = usePartVars(layout);
  const value = useDocViewerContextValue({
    props,
    layout,
    getStyles,
    session,
    events,
    store,
    adapters,
    thumbnails: { thumbnailsOpened, thumbnailsPosition },
  });

  return { value, session, partVars };
}
