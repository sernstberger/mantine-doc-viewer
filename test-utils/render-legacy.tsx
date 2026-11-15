/**
 * Migration aid for the restructure (RESTRUCTURE.md section 6): the old flat-props DocViewer,
 * rendered through the new API. Each old prop maps to its new home (table 1.8); the props the new
 * API removed are emulated with what replaces them (store subscriptions, useInterval, useMatches).
 * Part lanes move their tests to the new API and drop this helper; lane 7c deletes it.
 */
import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  MantineBreakpoint,
  MantineColor,
  MantineSize,
  MantineSpacing,
  TooltipProps,
  useMatches,
} from '@mantine/core';
import { useCallbackRef, useInterval, useIsomorphicEffect } from '@mantine/hooks';
import type { CodeHighlightProps } from '@mantine/code-highlight';
import { DocViewer as NewDocViewer } from '../package/src/DocViewer';
import type { DocViewerProps as NewDocViewerProps } from '../package/src/DocViewerBase';
import { DocViewerAdapterProvider } from '../package/src/DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerPdfJsOptions } from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { useDocViewerContext } from '../package/src/DocViewerBody/DocViewerBody';
import { createMarkupExtension } from '../package/src/DocViewerMarkup/markup-extension';
import { saveMarkup, setMarkupTool } from '../package/src/DocViewerMarkup/markup-actions';
import { createPageEditorExtension } from '../package/src/DocViewerPageEditor/page-editor-extension';
import { openPageEditor } from '../package/src/DocViewerPageEditor/page-editor-actions';
import { DEFAULT_LABELS } from '../package/src/default-labels';
import {
  useDocViewer as useDocViewerStoreAndActions,
  type DocViewerActions,
  type DocViewerState,
} from '../package/src/doc-viewer.store';
import type {
  DocViewerExtension,
  DocViewerPageLayout,
  DocViewerPasswordInputProps,
  DocViewerReadingProgress,
  DocViewerSearchInputProps,
  DocViewerThumbnailsPosition,
} from '../package/src/doc-viewer.types';
import { getDocViewerType, type DocViewerType } from '../package/src/utils/get-doc-viewer-type';
import type { DocViewerMark, DocViewerMarkupTool } from '../package/src/markup';
import type { DocViewerRenderPageOverlay } from '../package/src/utils/page-overlay';
import type { DocViewerPageRect } from '../package/src/utils/page-points';
import type { DocViewerPageTurning } from '../package/src/utils/spreads';
import { createLegacyPdfAdapter, legacyMarkdownAdapter } from './legacy-engines';
import { useIdleTimeout } from './legacy-kiosk';

export type { DocViewerAutoAdvance } from './legacy-kiosk';

type Responsive<T> = T | Partial<Record<'base' | MantineBreakpoint, T>>;

/** The old controller: the store actions plus the extension actions and two getters */
export interface DocViewerController extends Omit<DocViewerActions, 'nextSpread'> {
  nextSpread: () => void;
  editPages: () => void;
  setMarkupTool: (tool: DocViewerMarkupTool | null) => void;
  saveMarkup: () => Promise<void>;
  readonly canPrint: boolean;
  readonly type: DocViewerType;
}

export interface DocViewerFile {
  src: string;
  fileName: string | undefined;
  mimeType: string | undefined;
  type: DocViewerType;
}

export interface DocViewerRenderer {
  test: (file: DocViewerFile) => boolean;
  render: (file: DocViewerFile) => React.ReactNode;
}

export interface DocViewerProps extends Omit<
  NewDocViewerProps,
  | 'size'
  | 'pageLayout'
  | 'defaultPageLayout'
  | 'toolbarProps'
  | 'pagesProps'
  | 'thumbnailsProps'
  | 'searchProps'
  | 'imageProps'
  | 'textProps'
  | 'extensions'
  | 'autosize'
> {
  alt?: string;
  pdfWorkerSrc?: string;
  pdfOptions?: DocViewerPdfJsOptions;
  maxCanvasPixels?: number;
  defaultPageLayout?: Responsive<DocViewerPageLayout>;
  pageLayout?: Responsive<DocViewerPageLayout>;
  thumbnailsOpened?: boolean;
  onThumbnailsOpenedChange?: (opened: boolean) => void;
  thumbnailsPosition?: Responsive<DocViewerThumbnailsPosition>;
  onThumbnailsPositionChange?: (position: DocViewerThumbnailsPosition) => void;
  maxTextSize?: number;
  language?: string;
  size?: Responsive<MantineSize>;
  matchColor?: MantineColor;
  activeMatchColor?: MantineColor;
  pageGap?: Responsive<MantineSpacing>;
  thumbnailWidth?: Responsive<number>;
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;
  searchInputProps?: DocViewerSearchInputProps;
  passwordInputProps?: DocViewerPasswordInputProps;
  codeHighlightProps?: Omit<CodeHighlightProps, 'code' | 'language'>;
  controllerRef?: React.Ref<DocViewerController>;
  withPageTurning?: boolean | DocViewerPageTurning;
  withScrollSnap?: boolean;
  withScroll?: boolean;
  withPageEditing?: boolean;
  compactPageEditor?: boolean;
  onSave?: (
    bytes: Uint8Array,
    info: { reason: 'save' | 'extract' | 'reorder' | 'delete' | 'annotate'; pages: number[] }
  ) => void | Promise<void>;
  withFullscreen?: boolean;
  renderers?: DocViewerRenderer[];
  toolbarSection?: React.ReactNode;
  toolbarStartSection?: React.ReactNode;
  toolbarSubtitle?: React.ReactNode;
  renderToolbarTitle?: (info: { title: string; fileName: string | undefined }) => React.ReactNode;
  renderPageOverlay?: DocViewerRenderPageOverlay;
  tapToggleToolbar?: boolean;
  idleTimeout?: number;
  onIdle?: () => void;
  autoAdvance?: { interval: number; loop?: boolean };
  height?: 'auto' | (string & {}) | number;
  onDocumentLoadStart?: (info: { type: DocViewerType; src: string }) => void;
  onSpreadChange?: (spread: number, pages: number[]) => void;
  onReadingProgress?: (progress: DocViewerReadingProgress) => void;
  onReachEnd?: () => void;
  onLinkClick?: (url: string, event: MouseEvent) => void;
  onTextSelect?: (text: string, page: number, rects: DocViewerPageRect[]) => void;
  withMarkup?: boolean;
  markupTools?: DocViewerMarkupTool[];
  markupTool?: DocViewerMarkupTool | null;
  defaultMarkupTool?: DocViewerMarkupTool | null;
  onMarkupToolChange?: (tool: DocViewerMarkupTool | null) => void;
  markup?: DocViewerMark[];
  defaultMarkup?: DocViewerMark[];
  onMarkupChange?: (marks: DocViewerMark[]) => void;
  markupColor?: MantineColor;
  markupWidth?: number;
  markupFontSize?: number;
}

function isBreakpointMap<T>(value: Responsive<T> | undefined): value is Partial<Record<string, T>> {
  return typeof value === 'object' && value !== null;
}

function useResponsive<T>(value: Responsive<T> | undefined): T | undefined {
  return useMatches((isBreakpointMap(value) ? value : { base: value }) as Record<string, T>);
}

function getFileName(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }
  const name = src.split(/[?#]/)[0].split('/').pop();
  return name ? decodeURIComponent(name) : undefined;
}

/** Calls `onChange` whenever the selected part of the store state changes after mount */
function useStoreChange<T>(
  store: {
    subscribe: (fn: (state: DocViewerState) => void) => () => void;
    getState: () => DocViewerState;
  },
  select: (state: DocViewerState) => T,
  onChange: ((value: T) => void) | undefined
) {
  const handleChange = useCallbackRef(onChange);
  const selectRef = useRef(select);
  useEffect(() => {
    let last = selectRef.current(store.getState());
    return store.subscribe((state) => {
      const next = selectRef.current(state);
      if (next !== last) {
        last = next;
        handleChange(next);
      }
    });
  }, [store, handleChange]);
}

const MARKUP_PROPS = [
  'markupTools',
  'markupTool',
  'defaultMarkupTool',
  'onMarkupToolChange',
  'markup',
  'defaultMarkup',
  'onMarkupChange',
  'markupColor',
  'markupWidth',
  'markupFontSize',
] as const;

export function DocViewer(props: DocViewerProps) {
  const {
    src,
    type,
    mimeType,
    fileName,
    labels,
    alt,
    pdfWorkerSrc,
    pdfOptions,
    maxCanvasPixels,
    defaultPageLayout,
    pageLayout,
    thumbnailsOpened,
    onThumbnailsOpenedChange,
    thumbnailsPosition,
    onThumbnailsPositionChange,
    maxTextSize,
    language,
    size,
    matchColor,
    activeMatchColor,
    pageGap,
    thumbnailWidth,
    tooltipProps,
    searchInputProps,
    passwordInputProps,
    codeHighlightProps,
    controllerRef,
    withPageTurning,
    withScrollSnap,
    withScroll,
    withPageEditing,
    compactPageEditor,
    onSave,
    withFullscreen,
    renderers,
    toolbarSection,
    toolbarStartSection,
    toolbarSubtitle,
    renderToolbarTitle,
    renderPageOverlay,
    tapToggleToolbar,
    idleTimeout,
    onIdle,
    autoAdvance,
    height,
    onDocumentLoadStart,
    onSpreadChange,
    onReadingProgress,
    onReachEnd,
    onLinkClick,
    onTextSelect,
    withMarkup,
    markupTools,
    markupTool,
    defaultMarkupTool,
    onMarkupToolChange,
    markup,
    defaultMarkup,
    onMarkupChange,
    markupColor,
    markupWidth,
    markupFontSize,
    toolbarControls,
    store: storeProp,
    ...rest
  } = props;

  const [ownStore, actions] = useDocViewerStoreAndActions();
  const store = storeProp ?? ownStore;
  const resolvedType = type ?? getDocViewerType({ src, mimeType, fileName });
  const resolvedFileName = fileName ?? getFileName(src);

  const optionsRef = useRef(pdfOptions);
  optionsRef.current = pdfOptions;
  const pdfAdapter = useMemo(
    () => createLegacyPdfAdapter(pdfWorkerSrc, () => optionsRef.current),
    [pdfWorkerSrc]
  );

  useImperativeHandle(
    controllerRef,
    () => ({
      ...actions,
      nextSpread: () => actions.nextSpread(),
      editPages: () => openPageEditor(store),
      setMarkupTool: (tool) => setMarkupTool(tool, store),
      saveMarkup: () => saveMarkup(store),
      get canPrint() {
        return store.getState().canPrint;
      },
      get type() {
        return store.getState().type;
      },
    }),
    [actions, store]
  );

  const handleLoadStart = useCallbackRef(onDocumentLoadStart);
  useIsomorphicEffect(() => {
    handleLoadStart({ type: resolvedType, src });
  }, [resolvedType, src]);

  useStoreChange(
    store,
    (state) => (state.status === 'ready' ? state.spread : null),
    (spread) => spread && onSpreadChange?.(spread.index, spread.pages)
  );
  useStoreChange(store, (state) => state.thumbnailsOpened, onThumbnailsOpenedChange);
  useStoreChange(store, (state) => state.thumbnailsPosition, onThumbnailsPositionChange);

  const resolvedPosition = useResponsive(thumbnailsPosition);
  useIsomorphicEffect(() => {
    thumbnailsOpened !== undefined && actions.toggleThumbnails(thumbnailsOpened);
  }, [thumbnailsOpened]);
  useIsomorphicEffect(() => {
    resolvedPosition && actions.setThumbnailsPosition(resolvedPosition);
  }, [resolvedPosition]);

  const idle = useIdleTimeout(idleTimeout, onIdle);
  const playing = !!autoAdvance && (idleTimeout === undefined || idle);
  const loop = autoAdvance?.loop ?? true;
  const interval = useInterval(() => actions.nextSpread({ loop }), autoAdvance?.interval ?? 0);
  useEffect(() => {
    playing ? interval.start() : interval.stop();
    return interval.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, autoAdvance?.interval, loop]);

  const markupPropsGiven = MARKUP_PROPS.some((name) => props[name] !== undefined);
  const extensions = [
    withPageEditing &&
      createPageEditorExtension({
        compact: compactPageEditor,
        onDocumentChange: onSave && ((bytes, details) => onSave(bytes, details)),
        onExtract: onSave && ((bytes, { pages }) => onSave(bytes, { reason: 'extract', pages })),
      }),
    (withMarkup || markupPropsGiven) &&
      createMarkupExtension({
        tools: markupTools,
        tool: markupTool,
        defaultTool: defaultMarkupTool,
        onToolChange: onMarkupToolChange,
        value: markup,
        defaultValue: defaultMarkup,
        onChange: onMarkupChange,
        color: markupColor,
        width: markupWidth,
        fontSize: markupFontSize,
        onDocumentChange: onSave && ((bytes, details) => onSave(bytes, details)),
      }),
  ].filter(Boolean) as DocViewerExtension[];

  const controls = {
    ...toolbarControls,
    ...(withFullscreen === false && { fullscreen: false }),
    ...(!withMarkup && markupPropsGiven && { markup: false }),
  };
  const defaultTitle = resolvedFileName ?? labels?.documentLabel ?? DEFAULT_LABELS.documentLabel;
  const file = { src, fileName: resolvedFileName, mimeType, type: resolvedType };
  const renderer = renderers?.find((item) => item.test(file));

  return (
    <DocViewerAdapterProvider pdf={pdfAdapter} markdown={legacyMarkdownAdapter}>
      <NewDocViewer
        {...rest}
        src={src}
        type={type}
        mimeType={mimeType}
        fileName={fileName}
        labels={labels}
        store={store}
        extensions={extensions}
        size={useResponsive(size)}
        pageLayout={useResponsive(pageLayout)}
        defaultPageLayout={useResponsive(defaultPageLayout)}
        autosize={height === 'auto'}
        h={rest.h ?? (height === 'auto' ? undefined : height)}
        toolbarControls={Object.keys(controls).length > 0 ? controls : undefined}
        toolbarProps={{
          leftSection: toolbarStartSection,
          rightSection: toolbarSection,
          title: renderToolbarTitle?.({ title: defaultTitle, fileName: resolvedFileName }),
          subtitle: toolbarSubtitle,
          toggleOnTap: tapToggleToolbar,
          tooltipProps,
        }}
        pagesProps={{
          gap: useResponsive(pageGap),
          maxCanvasPixels,
          withScroll,
          withScrollSnap,
          withPageTurning,
          renderPageOverlay,
          matchColor,
          activeMatchColor,
          passwordInputProps,
          onLinkClick,
          onTextSelect:
            onTextSelect && ((text, { page, rects }) => onTextSelect(text, page, rects)),
          onReadingProgress,
          onReachEnd,
        }}
        thumbnailsProps={{ width: useResponsive(thumbnailWidth) }}
        searchProps={{ inputProps: searchInputProps }}
        imageProps={{ alt }}
        textProps={{ maxSize: maxTextSize, language, codeHighlightProps }}
      >
        {renderer?.render(file)}
      </NewDocViewer>
    </DocViewerAdapterProvider>
  );
}

/** The old context reader for custom renderers */
export const useDocViewer = useDocViewerContext;
