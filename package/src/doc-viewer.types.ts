import type {
  ActionIconProps,
  ElementProps,
  PasswordInputProps,
  TextInputProps,
} from '@mantine/core';
import type { DocViewerType } from './utils/get-doc-viewer-type';
import type { DocViewerPageRect } from './utils/page-points';

type DataAttributes = { [name: `data-${string}`]: string | number | boolean | undefined };

/** Props of the PDF search box that an app may set: not what the viewer controls (value, keys, size, ref, classes) */
export type DocViewerSearchInputProps = Omit<
  TextInputProps,
  'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'size' | 'className' | 'style'
> &
  DataAttributes;

/** Props of the PDF password field that an app may set: not what the viewer controls (value, error, size, classes) */
export type DocViewerPasswordInputProps = Omit<
  PasswordInputProps,
  'value' | 'defaultValue' | 'onChange' | 'error' | 'size' | 'className' | 'style'
> &
  DataAttributes;

export type DocViewerStylesNames =
  | 'root'
  | 'toolbar'
  | 'toolbarSection'
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
  | 'markupInput'
  | 'markupBar'
  | 'markupDivider'
  | 'markupSave'
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
  | 'passwordInput'
  | 'passwordSubmit'
  | 'viewMode'
  | 'dropdown'
  | 'documentInfo'
  | 'documentHeading'
  | 'documentLayer'
  | 'properties'
  | 'presentationControls'
  | 'editor'
  | 'editorBar'
  | 'editorTitle'
  | 'editorCount'
  | 'editorPages'
  | 'editorPage'
  | 'editorButton'
  | 'thumbnailDelete'
  | 'dragHandle';

/** Controls that `toolbarControls`, `DocViewer.Toolbar controls` and `DocViewer.OverlayControls controls` can hide */
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
    | '--doc-viewer-page-background';
};

/**
 * A scale where 1 is 100%, `'fit'` to fit PDF pages to the width of the view (images to the
 * whole view), or `'fit-page'` to fit whole PDF pages, or spreads in two-page layouts, to both
 * the width and the height of the view
 */
export type DocViewerZoom = number | 'fit' | 'fit-page';

/** How far a reader has got through a PDF */
export interface DocViewerReadingProgress {
  /** Fraction of each page that has been on screen, from 0 to 1, in page order: `seen[0]` is page 1 */
  seen: number[];

  /** How far the view is scrolled through the document, from 0 at the start to 1 at the end */
  position: number;

  /** True once the bottom of the last page has been on screen */
  reachedEnd: boolean;
}

export interface DocViewerGoToPageOptions {
  /**
   * Point to scroll to, in px at 100% (PDF points) down from the top of the page, in the
   * coordinates of `renderPageOverlay`. It is placed at the top of the view. Pages the reader
   * rotated use the point on their left edge
   */
  top?: number;

  /**
   * `'instant'` jumps straight there, for an app that animates the turn itself. By default the
   * view scrolls smoothly to near pages, unless the reader prefers reduced motion
   */
  behavior?: 'smooth' | 'instant';
}

/** What `highlight` marks: the first place a text is found, or boxes on a page */
export type DocViewerHighlightTarget =
  | {
      /** Text to find. Upper and lower case and accents are ignored unless `matchCase` is set */
      text: string;

      /** Page to look on, counted from 1. The whole document is searched when it is not set */
      page?: number;

      /** Determines whether upper and lower case must match @default false */
      matchCase?: boolean;
    }
  | {
      /** Page the boxes are on, counted from 1 */
      page: number;

      /** Boxes to mark, in the coordinates of `renderPageOverlay` */
      rects: DocViewerPageRect[];
    };

export interface DocViewerOutlineItem {
  title: string;

  /** Page the item goes to, counted from 1, or null for web links and broken destinations */
  page: number | null;

  /** Web address, for items that link outside the document */
  url: string | null;
  items: DocViewerOutlineItem[];
}

export interface DocViewerLoadInfo {
  type: DocViewerType;

  /** Number of pages of a PDF */
  numPages?: number;

  /** Natural size of an image in px */
  width?: number;
  height?: number;

  /** Size of the file in bytes, for PDFs and text, when the server says how large it is */
  byteSize?: number;

  /** MIME type: the `mimeType` prop, or what the server sent for text, or `application/pdf` for PDFs. Not set when unknown */
  mimeType?: string;

  /** Title from the PDF's document information, when it has one */
  title?: string;
}

/** What a page layer of an extension gets, once per PDF page */
export interface DocViewerPageLayerProps {
  /** Page number, counted from 1 */
  page: number;

  /** Number of pages of the document */
  numPages: number;

  /** Whether the page is near the visible area; far pages draw nothing heavy */
  near: boolean;

  /** Page size at 100% in PDF points, before the viewer's rotation */
  width: number;
  height: number;

  /** Scale the page is drawn at, where 1 is 100% */
  scale: number;

  /** Rotation of the view in degrees */
  rotation: 0 | 90 | 180 | 270;
}

/** Reorder and delete support an extension gives the thumbnails, provided by its `setup` */
export interface DocViewerReorderSlot {
  onReorder: (page: number, toIndex: number) => void | Promise<void>;

  /** Adds a delete action to each thumbnail and the Delete key; not set while one page is left */
  onDelete?: (page: number) => void | Promise<void>;
}

/** Extension from `mantine-doc-viewer/editor` or `mantine-doc-viewer/markup`, passed to `extensions` */
export interface DocViewerExtension {
  readonly name: 'page-editor' | 'markup' | (string & {});

  /**
   * @internal Mounted inside the PDF session around the viewer's content: hooks, registry, store
   * writes, and the contexts the extension's own parts and the session's slot contexts read
   */
  readonly setup?: React.ComponentType<{ children: React.ReactNode }>;

  /** @internal Toolbar controls the default toolbar inserts after their anchor control */
  readonly toolbarControls?: {
    control: DocViewerControl;
    after: DocViewerControl;
    Component: React.ComponentType;
  }[];

  /** @internal Bar under the toolbar */
  readonly bar?: React.ComponentType;

  /** @internal Layer drawn on every PDF page */
  readonly pageLayer?: React.ComponentType<DocViewerPageLayerProps>;

  /** @internal Action shown on every thumbnail; reorder support comes from `setup` (DocViewerReorderSlot) */
  readonly thumbnail?: {
    action?: React.ComponentType<{ page: number }>;
  };

  /** @internal Screen that replaces the content of `DocViewer.Main` while `state.mode` is `mode` */
  readonly screen?: { mode: string; Component: React.ComponentType };

  /** @internal Options the extension was created with */
  readonly options: unknown;
}

type ActionIconOwnProps = Omit<
  ActionIconProps,
  'classNames' | 'styles' | 'vars' | 'unstyled' | 'attributes' | 'children' | 'variant'
>;

/** Props of a toolbar button part: the props of `ActionIcon`, whose icon is fixed, and the props of a `button` */
export interface DocViewerControlProps
  extends ActionIconOwnProps, ElementProps<'button', keyof ActionIconProps> {}

/** Props of a toolbar button part that renders a link: the props of `ActionIcon` and of an `a` */
export interface DocViewerLinkControlProps
  extends ActionIconOwnProps, ElementProps<'a', keyof ActionIconProps> {}
