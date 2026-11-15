import type { BoxProps, ElementProps } from '@mantine/core';
import type { DocViewerProps } from './DocViewer';

/** Every prop DocViewer reads itself, so none of them reaches the root element */
const OWN_PROP_NAMES = [
  'classNames',
  'className',
  'style',
  'styles',
  'unstyled',
  'vars',
  'attributes',
  'src',
  'type',
  'mimeType',
  'fileName',
  'alt',
  'keepView',
  'labels',
  'locale',
  'pdfWorkerSrc',
  'pdfOptions',
  'maxCanvasPixels',
  'thumbnailsOpened',
  'defaultThumbnailsOpened',
  'onThumbnailsOpenedChange',
  'defaultPageLayout',
  'pageLayout',
  'thumbnailsPosition',
  'defaultThumbnailsPosition',
  'onThumbnailsPositionChange',
  'maxTextSize',
  'language',
  'radius',
  'size',
  'color',
  'matchColor',
  'activeMatchColor',
  'pageGap',
  'thumbnailWidth',
  'tooltipProps',
  'codeHighlightProps',
  'toolbarSection',
  'toolbarStartSection',
  'toolbarSubtitle',
  'renderToolbarTitle',
  'renderPageOverlay',
  'tapToggleToolbar',
  'withOverlayControls',
  'idleTimeout',
  'onIdle',
  'autoAdvance',
  'withToolbar',
  'height',
  'toolbarControls',
  'pageBackground',
  'pageColorScheme',
  'renderers',
  'controllerRef',
  'page',
  'defaultPage',
  'zoom',
  'defaultZoom',
  'withFullscreen',
  'fullscreen',
  'onFullscreenChange',
  'withPageEditing',
  'compactPageEditor',
  'withPageTurning',
  'withScrollSnap',
  'withScroll',
  'onSave',
  'onDocumentLoadStart',
  'withMarkup',
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
  'onDocumentLoad',
  'onDocumentError',
  'onPageChange',
  'onSpreadChange',
  'onZoomChange',
  'onPageLayoutChange',
  'onReadingProgress',
  'onReachEnd',
  'onLinkClick',
  'onTextSelect',
  'mod',
  'ref',
] as const satisfies readonly (keyof DocViewerProps | 'ref')[];

/**
 * DocViewer's own props missing from the list above. Must stay `never`: a new prop left out of
 * the list would otherwise land on the root div as an HTML attribute.
 */
type MissingOwnProps = Exclude<
  keyof DocViewerProps,
  // variant goes on to Box on purpose: Mantine renders it as data-variant
  keyof BoxProps | keyof ElementProps<'div'> | 'variant' | (typeof OWN_PROP_NAMES)[number]
>;
// Fails to compile, naming the missing prop, when MissingOwnProps is not never
const ownPropsListed: [MissingOwnProps] extends [never] ? true : MissingOwnProps = true;
void ownPropsListed;

const OWN_PROPS = new Set<string>(OWN_PROP_NAMES);

/** The props left over for the root element: everything DocViewer does not read itself */
export function getRootProps<T extends object>(props: T) {
  return Object.fromEntries(Object.entries(props).filter(([name]) => !OWN_PROPS.has(name))) as Omit<
    T,
    (typeof OWN_PROP_NAMES)[number]
  >;
}
