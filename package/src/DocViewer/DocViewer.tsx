import {
  Box,
  BoxProps,
  createVarsResolver,
  ElementProps,
  factory,
  Factory,
  getFontSize,
  getRadius,
  getSpacing,
  getThemeColor,
  isNumberLike,
  MantineColor,
  MantineRadius,
  MantineSize,
  MantineSpacing,
  rem,
  TooltipProps,
  StylesApiProps,
  useProps,
  useStyles,
} from '@mantine/core';
import type { CodeHighlightProps } from '@mantine/code-highlight';
import { useCallbackRef, useIsomorphicEffect, useMergedRef } from '@mantine/hooks';
import React, { useMemo } from 'react';
import {
  DocViewerController,
  DocViewerEvents,
  DocViewerZoom,
  useControllerRegistry,
  useRegisterController,
} from './controller';
import { detectDocType, DocType } from './detect-doc-type';
import { DocViewerProvider } from './DocViewer.context';
import { DocViewerAutoAdvance, useIdleTimeout } from './kiosk';
import classes from './DocViewer.module.css';
import type { DocViewerRenderToolbarTitle } from './DocViewerToolbar';
import { useTapToggle } from './use-tap-toggle';
import { OverlayControls } from './OverlayControls';
import { DEFAULT_LABELS, DocViewerLabels } from './labels';
import { useControlledFullscreen } from './use-controlled-fullscreen';
import type { DocViewerRenderPageOverlay } from './pdf/page-overlay';
import type { DocViewerPageTurning } from './pdf/spreads';
import type { DocViewerMarkupProps } from './pdf/use-markup';
import type { PdfLoadOptions } from './pdf/use-pdf-document';
import { MAX_CANVAS_PIXELS } from './pdf/render-page';
import type { DocViewerFile, DocViewerRenderer } from './renderers';
import { DocViewerResponsive, useResponsiveValue } from './responsive';
import { DOC_VIEWER_SIZES } from './sizes';
import { PdfView } from './pdf/PdfView';
import { CodeView } from './text/CodeView';
import { MarkdownView } from './text/MarkdownView';
import { TextView } from './text/TextView';
import { ImageView } from './views/ImageView';
import { UnsupportedView } from './views/UnsupportedView';

export type DocViewerStylesNames =
  | 'root'
  | 'toolbar'
  | 'toolbarStart'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'controls'
  | 'overlayControls'
  | 'overlayControl'
  | 'control'
  | 'body'
  | 'image'
  | 'imageStage'
  | 'imageCanvas'
  | 'imageFrame'
  | 'imageOverlay'
  | 'empty'
  | 'pageIndicator'
  | 'zoomLevel'
  | 'pages'
  | 'page'
  | 'canvas'
  | 'textLayer'
  | 'linkLayer'
  | 'pageOverlay'
  | 'highlightLayer'
  | 'highlight'
  | 'markupLayer'
  | 'markupText'
  | 'markupBar'
  | 'search'
  | 'searchInput'
  | 'searchCount'
  | 'searchOption'
  | 'main'
  | 'thumbnails'
  | 'thumbnail'
  | 'thumbnailImage'
  | 'thumbnailLabel'
  | 'text'
  | 'code'
  | 'markdown'
  | 'outline'
  | 'outlineList'
  | 'outlineItem'
  | 'password'
  | 'documentInfo'
  | 'properties'
  | 'presentationControls'
  | 'editor'
  | 'editorBar'
  | 'editorPages'
  | 'editorPage'
  | 'editorButton'
  | 'thumbnailDelete'
  | 'dragHandle';

/** Toolbar controls that `toolbarControls` can hide */
export type DocViewerControl =
  | 'title'
  | 'thumbnails'
  | 'pages'
  | 'zoom'
  | 'rotate'
  | 'layout'
  | 'outline'
  | 'info'
  | 'presentation'
  | 'editPages'
  | 'markup'
  | 'search'
  | 'print'
  | 'download'
  | 'fullscreen'
  | 'wrap'
  | 'viewMode';

export type DocViewerVariant = 'default' | 'plain';

export type DocViewerPageLayout =
  | 'single'
  | 'two-page'
  | 'two-page-cover'
  | 'horizontal'
  | 'wrapped';

export type DocViewerThumbnailsPosition = 'left' | 'right' | 'top' | 'bottom';

export type DocViewerCssVariables = {
  root:
    | '--doc-viewer-radius'
    | '--doc-viewer-color'
    | '--doc-viewer-font-size'
    | '--doc-viewer-toolbar-height'
    | '--doc-viewer-page-gap'
    | '--doc-viewer-page-background'
    | '--doc-viewer-thumbnail-width'
    | '--doc-viewer-match-color'
    | '--doc-viewer-active-match-color';
};

export interface DocViewerProps
  extends
    BoxProps,
    StylesApiProps<DocViewerFactory>,
    ElementProps<'div'>,
    DocViewerEvents,
    DocViewerMarkupProps {
  /** Url of the document: a regular url, blob url or data url */
  src: string;

  /** Document type, detected from `mimeType`, `fileName` or `src` when not set */
  type?: DocType;

  /** MIME type of the document, used to detect `type` */
  mimeType?: string;

  /** File name displayed in the toolbar and used for downloads, taken from `src` by default */
  fileName?: string;

  /** Alternative text for images, `fileName` by default */
  alt?: string;

  /**
   * Determines whether the viewer keeps zoom, rotation, page layout and scroll position when `src`
   * changes to another document of the same type, for example a next button, `false` by default.
   * Search, page edits and the loaded document itself still reset. Otherwise a new `src` starts the
   * viewer afresh
   */
  keepView?: boolean;

  /** BCP 47 language tag, such as `'de-DE'`, for the numbers and dates the viewer shows: zoom, page counts, file sizes and document properties. The browser's language by default. Text comes from `labels` */
  locale?: string;

  /** Text shown or read out by the viewer, override any of it to translate the viewer */
  labels?: Partial<DocViewerLabels>;

  /** Url of the pdf.js worker file (`pdfjs-dist/build/pdf.worker.min.mjs`), required to display PDF files */
  pdfWorkerSrc?: string;

  /**
   * Options for pdf.js `getDocument`, for example `password`, `withCredentials`, `httpHeaders`,
   * `cMapUrl` or `disableRange` for servers that do not support range requests. By default only
   * the parts of a PDF needed for the pages on screen are downloaded (`disableAutoFetch` and
   * `disableStream`). Read when a document starts loading
   */
  pdfOptions?: PdfLoadOptions;

  /** Largest canvas drawn for a PDF page, in pixels. Pages are drawn at a lower resolution beyond it, `16_777_216` by default (the Safari limit) */
  maxCanvasPixels?: number;

  /**
   * How PDF pages are laid out when a PDF opens, `'single'` by default: one per row, two per row,
   * two per row with the first page on its own as a cover, one row scrolled sideways, or rows that
   * wrap. Readers can change it from the toolbar. Takes a value per breakpoint, for example
   * `{ base: 'single', sm: 'two-page-cover' }`; it follows the screen until the reader picks a
   * layout
   */
  defaultPageLayout?: DocViewerResponsive<DocViewerPageLayout>;

  /**
   * Controlled PDF page layout, for an app that sets it itself. Also takes a value per breakpoint.
   * A layout the reader picks from the toolbar is reported to `onPageLayoutChange`, and shown once
   * the app passes it back. The current page stays in view when the layout changes
   */
  pageLayout?: DocViewerResponsive<DocViewerPageLayout>;

  /** Determines whether PDF page thumbnails are shown when a PDF opens, `false` by default */
  defaultThumbnailsOpened?: boolean;

  /** Side of the viewer that PDF page thumbnails are shown on, for a controlled position. Can differ per breakpoint, for example `{ base: 'bottom', sm: 'left' }` */
  thumbnailsPosition?: DocViewerResponsive<DocViewerThumbnailsPosition>;

  /** Side that PDF page thumbnails are shown on at first, `'left'` by default. Readers can move them from the toolbar */
  defaultThumbnailsPosition?: DocViewerThumbnailsPosition;

  /** Called when the reader moves the PDF page thumbnails */
  onThumbnailsPositionChange?: (position: DocViewerThumbnailsPosition) => void;

  /** Largest text, code or markdown file that is displayed, in bytes, `2_000_000` by default */
  maxTextSize?: number;

  /** Highlighter language for code files, detected from the file extension when not set */
  language?: string;

  /** Key of `theme.radius` or any valid CSS value to set `border-radius`, `theme.defaultRadius` by default */
  radius?: MantineRadius;

  /** Size of the toolbar, its buttons and text, `'sm'` by default. Can differ per breakpoint, for example `{ base: 'md', sm: 'sm' }` */
  size?: DocViewerResponsive<MantineSize>;

  /** Key of `theme.colors` or any valid CSS color for pressed toolbar buttons, the current thumbnail and focus outlines, `theme.primaryColor` by default */
  color?: MantineColor;

  /** Key of `theme.colors` or any valid CSS color of PDF search matches, `'yellow'` by default */
  matchColor?: MantineColor;

  /** Key of `theme.colors` or any valid CSS color of the PDF search match that is currently selected, `'orange'` by default */
  activeMatchColor?: MantineColor;

  /** Key of `theme.spacing` or any valid CSS value for the space between PDF pages, `'md'` by default. Can differ per breakpoint */
  pageGap?: DocViewerResponsive<MantineSpacing>;

  /** Width of PDF page thumbnails in the side rail in px, half of it in the top or bottom strip, `112` by default. Can differ per breakpoint */
  thumbnailWidth?: DocViewerResponsive<number>;

  /** Props passed to every toolbar tooltip, for example `{ disabled: true }` or `{ position: 'bottom' }` */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;

  /** Props passed to the CodeHighlight that shows code files and markdown source */
  codeHighlightProps?: Omit<CodeHighlightProps, 'code' | 'language'>;

  /** Ref to the viewer's actions: `goToPage`, `goToSpread`, `setZoom`, `print`, `toggleFullscreen` and more */
  controllerRef?: React.Ref<DocViewerController>;

  /** Page of a PDF to show, counted from 1. The viewer scrolls to it whenever it changes; use with `onPageChange` */
  page?: number;

  /** Page of a PDF to show when it opens, counted from 1 */
  defaultPage?: number;

  /**
   * Zoom when a PDF or image opens, `'fit'` by default: a scale where 1 is 100%, `'fit'` to fit
   * PDF pages to the width of the view, or `'fit-page'` to fit a whole page, or a whole spread
   * in two-page layouts, in the view. Images fit the whole view with either
   */
  defaultZoom?: DocViewerZoom;

  /**
   * Determines whether PDF pages turn by spread, like a book: a click or tap on the left or right
   * edge of the view, a sideways swipe, or Arrow left, Arrow right, Page up and Page down from
   * anywhere on the page (the keys page turner pedals send). `true` turns all of them on; pass
   * `{ swipe: false }` and the like to leave some out. `false` by default
   */
  withPageTurning?: boolean | DocViewerPageTurning;

  /** Determines whether scrolling a PDF stops at the start of each page, or of each spread in two-page layouts, `false` by default */
  withScrollSnap?: boolean;

  /**
   * Determines whether readers can scroll a PDF, `true` by default. Turn it off when the app turns
   * pages itself, with `withPageTurning`, `goToPage` or its own buttons: wheel, touch and key
   * scrolling stop, while text selection, zoom and the controller keep working
   */
  withScroll?: boolean;

  /** Determines whether readers can reorder, remove and extract PDF pages (in the page editor, and by dragging or deleting thumbnails), `false` by default. Edits make a new document; the original file is not changed */
  withPageEditing?: boolean;

  /** Determines whether the page editor's buttons show only an icon, with the label as tooltip and screen reader name, for narrow screens, `false` by default */
  compactPageEditor?: boolean;

  /**
   * Called with the bytes of a PDF made by page editing: the edited document (`reason: 'save'`),
   * the extracted pages (`reason: 'extract'`), or the document after a thumbnail was dragged to a
   * new place (`reason: 'reorder'`), after a thumbnail's delete button was used (`reason:
   * 'delete'`), or with the marks drawn with the markup tools written in (`reason: 'annotate'`,
   * `pages` are the pages with marks). Without it, saved, extracted and marked up PDFs are
   * downloaded; a reorder or delete only changes what the viewer shows
   */
  onSave?: (
    bytes: Uint8Array,
    info: { reason: 'save' | 'extract' | 'reorder' | 'delete' | 'annotate'; pages: number[] }
  ) => void | Promise<void>;

  /** Determines whether the toolbar has a print button, `true` by default */
  withPrint?: boolean;

  /** Determines whether the toolbar has a download button, `true` by default */
  withDownload?: boolean;

  /** Determines whether the toolbar has a full screen button, `true` by default */
  withFullscreen?: boolean;

  /**
   * Determines whether the viewer is full screen, for a controlled state. Use with
   * `onFullscreenChange`. Browsers only allow full screen after a click or key press, so set it
   * from an event handler. When a request is refused, or the reader presses Escape,
   * `onFullscreenChange` reports what really happened
   */
  fullscreen?: boolean;

  /** Called when the viewer enters or leaves full screen, by the toolbar, the controller, `fullscreen` or the browser */
  onFullscreenChange?: (fullscreen: boolean) => void;

  /** Renderers for file types the viewer does not show itself, such as CSV, checked in order before the built-in views */
  renderers?: DocViewerRenderer[];

  /** Content displayed in the toolbar before the download button */
  toolbarSection?: React.ReactNode;

  /** Content displayed at the start of the toolbar, before the title, for example a menu button. Styles API name: `toolbarStart` */
  toolbarStartSection?: React.ReactNode;

  /** Small text under the title, for example "Draft 4" or "Edited". Styles API name: `subtitle` */
  toolbarSubtitle?: React.ReactNode;

  /** Renders the title in place of the file name, for example the sheet that is open. Called with the file name and the default title */
  renderToolbarTitle?: DocViewerRenderToolbarTitle;

  /**
   * Content laid over each PDF page, such as comment pins, review marks or proof boxes. It gets
   * the page number, the page size at 100% and the current `scale`: place content at
   * `left: x * scale, top: y * scale` from the page's top-left. The overlay turns with the page
   * when the reader rotates it. It lets clicks through to the page's text; its children take them
   */
  renderPageOverlay?: DocViewerRenderPageOverlay;

  /**
   * Determines whether tapping the viewer with a finger hides and shows the toolbar, so a page can
   * fill a phone, `false` by default. The toolbar is shown at first. Taps on buttons and links, and
   * mouse clicks, do nothing
   */
  tapToggleToolbar?: boolean;

  /**
   * Determines whether zoom and full screen buttons float over the top right of the document,
   * for a viewer without a toolbar (`withToolbar={false}`), `false` by default. The buttons follow
   * `withFullscreen`. Styles API names: `overlayControls` and `overlayControl`
   */
  withOverlayControls?: boolean;

  /**
   * Time in ms without a touch, key press, mouse move or wheel turn after which the viewer counts
   * as idle and `onIdle` is called. For a kiosk: send the next visitor back to the start. The
   * whole page is watched, not only the viewer
   */
  idleTimeout?: number;

  /** Called when the viewer has been idle for `idleTimeout` ms, and again after each time it was used and left alone. Use it to go back to the first page and reset the zoom, and `controllerRef.resetReadingProgress()` */
  onIdle?: () => void;

  /**
   * Plays a PDF: shows the next page every `interval` ms, with `loop` to start over after the
   * last page. With `idleTimeout` it plays only while the viewer is idle, so it starts after
   * `onIdle` and stops at the next touch; without it, it plays all the time. Two-page layouts
   * turn a spread at a time
   */
  autoAdvance?: DocViewerAutoAdvance;

  /** Toolbar controls to hide, for example `{ rotate: false, layout: false }`. All are shown by default */
  toolbarControls?: Partial<Record<DocViewerControl, boolean>>;

  /** Key of `theme.colors` or any valid CSS color behind PDF pages and thumbnails, white by default */
  pageBackground?: MantineColor;

  /**
   * Colours of PDF pages: as printed (`'light'`, default), inverted for dark interfaces (`'dark'`),
   * or following the Mantine color scheme (`'auto'`). Inverting keeps hues, so images and charts
   * stay recognisable
   */
  pageColorScheme?: 'light' | 'dark' | 'auto';

  /** Determines whether the toolbar is displayed, `true` by default */
  withToolbar?: boolean;

  /**
   * Height of the viewer, a number in px or any CSS value; the viewer fills its parent by default
   * when the parent has a height. `'auto'` makes the viewer as tall as its content, so the page
   * scrolls instead of the viewer: a PDF shows all its pages, text and code show every line. Page
   * tracking, `goToPage` and search then scroll the window. Images and custom renderers keep a
   * minimum height. Full screen and presentations use the whole screen as usual
   */
  height?: 'auto' | (string & {}) | number;
}

export type DocViewerFactory = Factory<{
  props: DocViewerProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerStylesNames;
  vars: DocViewerCssVariables;
  variant: DocViewerVariant;
}>;

const DEFAULT_THUMBNAIL_WIDTH = 112;

const defaultProps: Partial<DocViewerProps> = {
  withToolbar: true,
  maxTextSize: 2_000_000,
  size: 'sm',
  thumbnailWidth: DEFAULT_THUMBNAIL_WIDTH,
  maxCanvasPixels: MAX_CANVAS_PIXELS,
  defaultZoom: 'fit',
  withPrint: true,
  withDownload: true,
  withFullscreen: true,
};

/** Props after responsive values are resolved for the current viewport */
type ResolvedDocViewerProps = Omit<
  DocViewerProps,
  'size' | 'pageGap' | 'thumbnailWidth' | 'thumbnailsPosition'
> & {
  thumbnailsPosition?: DocViewerThumbnailsPosition;
  size?: MantineSize;
  pageGap?: MantineSpacing;
  thumbnailWidth?: number;
};

const varsResolver = createVarsResolver<DocViewerFactory>((theme, props) => {
  const {
    radius,
    size,
    color,
    matchColor,
    activeMatchColor,
    pageGap,
    thumbnailWidth,
    pageBackground,
  } = props as ResolvedDocViewerProps;
  // size is resolved for the viewport before it gets here; CSS sizes such as 5rem fall back to sm
  const sizeConfig = DOC_VIEWER_SIZES[size!] ?? DOC_VIEWER_SIZES.sm;

  return {
    root: {
      '--doc-viewer-radius': getRadius(radius),
      '--doc-viewer-color': color ? getThemeColor(color, theme) : undefined,
      '--doc-viewer-font-size': getFontSize(sizeConfig.fontSize),
      '--doc-viewer-toolbar-height': rem(sizeConfig.toolbarHeight),
      '--doc-viewer-page-gap': pageGap === undefined ? undefined : getSpacing(pageGap),
      '--doc-viewer-page-background': pageBackground
        ? getThemeColor(pageBackground, theme)
        : undefined,
      '--doc-viewer-thumbnail-width': thumbnailWidth ? rem(thumbnailWidth) : undefined,
      '--doc-viewer-match-color': matchColor ? getThemeColor(matchColor, theme) : undefined,
      '--doc-viewer-active-match-color': activeMatchColor
        ? getThemeColor(activeMatchColor, theme)
        : undefined,
    },
  };
});

function getFileName(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }

  const name = src.split(/[?#]/)[0].split('/').pop();
  return name ? decodeURIComponent(name) : undefined;
}

function renderView(file: DocViewerFile, renderers: DocViewerRenderer[] | undefined) {
  const renderer = renderers?.find((item) => item.test(file));
  if (renderer) {
    return renderer.render(file);
  }

  const { type } = file;
  switch (type) {
    case 'pdf':
      return <PdfView />;
    case 'image':
      return <ImageView />;
    case 'text':
      return <TextView />;
    case 'code':
      return <CodeView />;
    case 'markdown':
      return <MarkdownView />;
    default:
      return <UnsupportedView type={type} />;
  }
}

export const DocViewer = factory<DocViewerFactory>((_props) => {
  const props = useProps('DocViewer', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    src,
    type,
    mimeType,
    fileName,
    alt,
    keepView,
    labels,
    locale,
    pdfWorkerSrc,
    pdfOptions,
    maxCanvasPixels,
    defaultThumbnailsOpened,
    defaultPageLayout,
    pageLayout,
    thumbnailsPosition,
    defaultThumbnailsPosition,
    onThumbnailsPositionChange,
    maxTextSize,
    language,
    radius,
    size,
    color,
    matchColor,
    activeMatchColor,
    pageGap,
    thumbnailWidth,
    tooltipProps,
    codeHighlightProps,
    toolbarSection,
    toolbarStartSection,
    toolbarSubtitle,
    renderToolbarTitle,
    renderPageOverlay,
    tapToggleToolbar,
    withOverlayControls,
    idleTimeout,
    onIdle,
    autoAdvance,
    withToolbar,
    height,
    toolbarControls,
    pageBackground,
    pageColorScheme,
    renderers,
    controllerRef,
    page,
    defaultPage,
    defaultZoom,
    withPrint,
    withDownload,
    withFullscreen,
    fullscreen: fullscreenProp,
    onFullscreenChange,
    withPageEditing,
    compactPageEditor,
    withPageTurning,
    withScrollSnap,
    withScroll,
    onSave,
    onDocumentLoadStart,
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
    mod,
    ref,
    ...others
  } = props;

  const resolvedSize = useResponsiveValue(size) ?? 'sm';
  const resolvedPageGap = useResponsiveValue(pageGap);
  const resolvedThumbnailWidth = useResponsiveValue(thumbnailWidth) ?? DEFAULT_THUMBNAIL_WIDTH;
  const resolvedThumbnailsPosition = useResponsiveValue(thumbnailsPosition);
  const resolvedDefaultPageLayout = useResponsiveValue(defaultPageLayout);
  const resolvedPageLayout = useResponsiveValue(pageLayout);

  const getStyles = useStyles<DocViewerFactory>({
    name: 'DocViewer',
    classes,
    props: {
      ...props,
      size: resolvedSize,
      pageGap: resolvedPageGap,
      thumbnailWidth: resolvedThumbnailWidth,
      thumbnailsPosition: resolvedThumbnailsPosition,
    } satisfies ResolvedDocViewerProps,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const tapToggle = useTapToggle(tapToggleToolbar);
  const resolvedType = type ?? detectDocType({ src, mimeType, fileName });
  const resolvedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const idle = useIdleTimeout(idleTimeout, onIdle);
  const playing = autoAdvance && (idleTimeout === undefined || idle) ? autoAdvance : undefined;
  const controller = useControllerRegistry(controllerRef);
  const fullscreen = useControlledFullscreen(fullscreenProp, onFullscreenChange);
  const rootRef = useMergedRef(ref, fullscreen.ref);

  const resolvedFileName = fileName ?? getFileName(src);
  useRegisterController(controller, {
    download: () => {
      const link = document.createElement('a');
      link.href = src;
      link.download = resolvedFileName ?? '';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    },
    toggleFullscreen: () => fullscreen.toggle(),
    getType: () => resolvedType,
  });

  // Stable, so views can call them from effects without re-running them
  const handleDocumentLoadStart = useCallbackRef(onDocumentLoadStart);
  const handleDocumentLoad = useCallbackRef(onDocumentLoad);
  const handleDocumentError = useCallbackRef(onDocumentError);
  const handlePageChange = useCallbackRef(onPageChange);
  const handleSpreadChange = useCallbackRef(onSpreadChange);
  const handleZoomChange = useCallbackRef(onZoomChange);
  const handlePageLayoutChange = useCallbackRef(onPageLayoutChange);
  const handleReadingProgress = useCallbackRef(onReadingProgress);
  const handleReachEnd = useCallbackRef(onReachEnd);
  const handleLinkClick = useCallbackRef(onLinkClick);
  const handleTextSelect = useCallbackRef(onTextSelect);
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
  useIsomorphicEffect(() => {
    handleDocumentLoadStart({ type: resolvedType, src });
  }, [resolvedType, src, handleDocumentLoadStart]);

  return (
    <DocViewerProvider
      value={{
        getStyles,
        src,
        type: resolvedType,
        mimeType,
        fileName: resolvedFileName,
        alt,
        keepView,
        labels: resolvedLabels,
        locale,
        withToolbar,
        toolbarHidden: tapToggle.hidden,
        autoHeight: height === 'auto',
        toolbarControls,
        toolbarSection,
        toolbarStartSection,
        toolbarSubtitle,
        renderToolbarTitle,
        renderPageOverlay,
        autoAdvance: playing,
        pdfWorkerSrc,
        pdfOptions,
        maxCanvasPixels: maxCanvasPixels!,
        defaultThumbnailsOpened,
        defaultPageLayout: resolvedDefaultPageLayout,
        pageLayout: resolvedPageLayout,
        thumbnailsPosition: resolvedThumbnailsPosition,
        defaultThumbnailsPosition,
        onThumbnailsPositionChange,
        maxTextSize: maxTextSize!,
        language,
        size: DOC_VIEWER_SIZES[resolvedSize] ?? DOC_VIEWER_SIZES.sm,
        color,
        thumbnailWidth: resolvedThumbnailWidth,
        tooltipProps,
        codeHighlightProps,
        controller,
        events,
        page,
        defaultPage,
        defaultZoom: defaultZoom!,
        withPrint,
        withDownload,
        withFullscreen,
        withPageEditing,
        compactPageEditor,
        withPageTurning,
        withScrollSnap,
        withScroll,
        onSave,
        markup: {
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
        },
        fullscreen: fullscreen.fullscreen,
        toggleFullscreen: fullscreen.toggle,
      }}
    >
      <Box
        ref={rootRef}
        {...getStyles('root')}
        data-doc-type={resolvedType}
        data-page-color-scheme={pageColorScheme === 'light' ? undefined : pageColorScheme}
        // Like core components: data-size for size keys, not for CSS values such as 5rem
        mod={[
          {
            size: isNumberLike(resolvedSize) ? undefined : resolvedSize,
            fullscreen: fullscreen.fullscreen,
            'auto-height': height === 'auto',
          },
          mod,
        ]}
        {...others}
        {...tapToggle.handlers}
        h={others.h ?? height}
      >
        {/* Keyed so that zoom, rotation and search reset when the document changes, unless the view is kept */}
        <React.Fragment key={keepView ? resolvedType : `${resolvedType}:${src}`}>
          {renderView({ src, fileName: resolvedFileName, mimeType, type: resolvedType }, renderers)}
        </React.Fragment>
        {withOverlayControls && <OverlayControls />}
      </Box>
    </DocViewerProvider>
  );
});

DocViewer.displayName = 'DocViewer';
DocViewer.classes = classes;
