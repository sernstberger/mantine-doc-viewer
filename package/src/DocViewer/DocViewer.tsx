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
import { useCallbackRef, useFullscreenElement, useMergedRef } from '@mantine/hooks';
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
import classes from './DocViewer.module.css';
import { DEFAULT_LABELS, DocViewerLabels } from './labels';
import type { DocViewerRenderPageOverlay } from './pdf/page-overlay';
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
  | 'title'
  | 'controls'
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
  extends BoxProps, StylesApiProps<DocViewerFactory>, ElementProps<'div'>, DocViewerEvents {
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
   * wrap. Readers can change it from the toolbar
   */
  defaultPageLayout?: DocViewerPageLayout;

  /** Determines whether PDF page thumbnails are shown when a PDF opens, `false` by default */
  defaultThumbnailsOpened?: boolean;

  /** Side of the viewer that PDF page thumbnails are shown on, for a controlled position */
  thumbnailsPosition?: DocViewerThumbnailsPosition;

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

  /** Ref to the viewer's actions: `goToPage`, `setZoom`, `print`, `toggleFullscreen` and more */
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

  /** Determines whether readers can reorder, remove and extract PDF pages (in the page editor, and by dragging thumbnails), `false` by default. Edits make a new document; the original file is not changed */
  withPageEditing?: boolean;

  /**
   * Called with the bytes of a PDF made by page editing: the edited document (`reason: 'save'`),
   * the extracted pages (`reason: 'extract'`), or the document after a thumbnail was dragged to a
   * new place (`reason: 'reorder'`). Without it, saved and extracted PDFs are downloaded; a
   * reorder only changes what the viewer shows
   */
  onSave?: (
    bytes: Uint8Array,
    info: { reason: 'save' | 'extract' | 'reorder'; pages: number[] }
  ) => void | Promise<void>;

  /** Determines whether the toolbar has a print button, `true` by default */
  withPrint?: boolean;

  /** Determines whether the toolbar has a download button, `true` by default */
  withDownload?: boolean;

  /** Determines whether the toolbar has a full screen button, `true` by default */
  withFullscreen?: boolean;

  /** Renderers for file types the viewer does not show itself, such as CSV, checked in order before the built-in views */
  renderers?: DocViewerRenderer[];

  /** Content displayed in the toolbar before the download button */
  toolbarSection?: React.ReactNode;

  /**
   * Content laid over each PDF page, such as comment pins, review marks or proof boxes. It gets
   * the page number, the page size at 100% and the current `scale`: place content at
   * `left: x * scale, top: y * scale` from the page's top-left. The overlay turns with the page
   * when the reader rotates it. It lets clicks through to the page's text; its children take them
   */
  renderPageOverlay?: DocViewerRenderPageOverlay;

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
type ResolvedDocViewerProps = Omit<DocViewerProps, 'size' | 'pageGap' | 'thumbnailWidth'> & {
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
    labels,
    pdfWorkerSrc,
    pdfOptions,
    maxCanvasPixels,
    defaultThumbnailsOpened,
    defaultPageLayout,
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
    renderPageOverlay,
    withToolbar,
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
    withPageEditing,
    onSave,
    onDocumentLoad,
    onDocumentError,
    onPageChange,
    onZoomChange,
    onLinkClick,
    mod,
    ref,
    ...others
  } = props;

  const resolvedSize = useResponsiveValue(size) ?? 'sm';
  const resolvedPageGap = useResponsiveValue(pageGap);
  const resolvedThumbnailWidth = useResponsiveValue(thumbnailWidth) ?? DEFAULT_THUMBNAIL_WIDTH;

  const getStyles = useStyles<DocViewerFactory>({
    name: 'DocViewer',
    classes,
    props: {
      ...props,
      size: resolvedSize,
      pageGap: resolvedPageGap,
      thumbnailWidth: resolvedThumbnailWidth,
    } satisfies ResolvedDocViewerProps,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const resolvedType = type ?? detectDocType({ src, mimeType, fileName });
  const resolvedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const controller = useControllerRegistry(controllerRef);
  const fullscreen = useFullscreenElement<HTMLDivElement>();
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
  });

  // Stable, so views can call them from effects without re-running them
  const handleDocumentLoad = useCallbackRef(onDocumentLoad);
  const handleDocumentError = useCallbackRef(onDocumentError);
  const handlePageChange = useCallbackRef(onPageChange);
  const handleZoomChange = useCallbackRef(onZoomChange);
  const handleLinkClick = useCallbackRef(onLinkClick);
  const events = useMemo(
    () => ({
      onDocumentLoad: handleDocumentLoad,
      onDocumentError: handleDocumentError,
      onPageChange: handlePageChange,
      onZoomChange: handleZoomChange,
      onLinkClick: handleLinkClick,
    }),
    [handleDocumentLoad, handleDocumentError, handlePageChange, handleZoomChange, handleLinkClick]
  );

  return (
    <DocViewerProvider
      value={{
        getStyles,
        src,
        fileName: resolvedFileName,
        alt,
        labels: resolvedLabels,
        withToolbar,
        toolbarControls,
        toolbarSection,
        renderPageOverlay,
        pdfWorkerSrc,
        pdfOptions,
        maxCanvasPixels: maxCanvasPixels!,
        defaultThumbnailsOpened,
        defaultPageLayout,
        thumbnailsPosition,
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
        onSave,
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
          },
          mod,
        ]}
        {...others}
      >
        {/* Keyed so that zoom, rotation and search reset when the document changes */}
        <React.Fragment key={`${resolvedType}:${src}`}>
          {renderView({ src, fileName: resolvedFileName, mimeType, type: resolvedType }, renderers)}
        </React.Fragment>
      </Box>
    </DocViewerProvider>
  );
});

DocViewer.displayName = 'DocViewer';
DocViewer.classes = classes;
