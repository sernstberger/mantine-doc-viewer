import type { DocViewerMarkupTool } from './utils/markup';

/** Text shown or read out by the viewer, override any of it with the `labels` prop to translate it */
export interface DocViewerLabels {
  /** Name used when the file has no name, for the title and the screen reader name of the viewer */
  documentLabel: string;
  toolbarLabel: string;

  /** Alternative text of images when neither `alt` nor `fileName` is set */
  imageLabel: string;

  downloadLabel: string;
  downloadFileLabel: string;
  printLabel: string;
  presentationLabel: string;
  exitPresentationLabel: string;
  /** Read out when a presentation starts */
  presentationStartedLabel: string;
  fullscreenLabel: string;
  exitFullscreenLabel: string;
  loadingLabel: string;

  zoomInLabel: string;
  zoomOutLabel: string;
  resetZoomLabel: string;
  /** Read out after zooming, with the zoom as a percentage */
  zoomLevelLabel: (percent: string) => string;
  fitToWidthLabel: string;
  fitToViewLabel: string;
  rotateLabel: string;

  pageThumbnailsLabel: string;
  showPagesLabel: string;
  hidePagesLabel: string;
  pagesLabel: string;
  outlineLabel: string;
  documentInfoLabel: string;
  propertiesLabel: string;
  propertyNameLabels: Record<
    | 'title'
    | 'author'
    | 'subject'
    | 'keywords'
    | 'creator'
    | 'producer'
    | 'created'
    | 'modified'
    | 'pdfVersion'
    | 'fileSize'
    | 'pageCount'
    | 'pageSize',
    string
  >;
  attachmentsLabel: string;
  downloadAttachmentLabel: (fileName: string) => string;
  layersLabel: string;
  noOutlineLabel: string;
  pageLayoutLabel: string;
  layoutSingleLabel: string;
  layoutTwoPageLabel: string;
  layoutTwoPageCoverLabel: string;
  layoutHorizontalLabel: string;
  layoutWrappedLabel: string;
  passwordRequiredLabel: string;
  passwordIncorrectLabel: string;
  passwordLabel: string;
  unlockLabel: string;
  thumbnailsPositionLabel: string;
  leftLabel: string;
  rightLabel: string;
  topLabel: string;
  bottomLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  pageOfLabel: (page: number, total: number) => string;
  /** Read inside a page that has no text layer, such as a scanned page */
  pageHasNoTextLabel: string;
  /** Screen reader name of a page thumbnail */
  thumbnailLabel: (page: number) => string;
  /** Screen reader name of a link inside a PDF that goes to another page */
  linkToPageLabel: (page: number) => string;

  searchLabel: string;
  searchDocumentLabel: string;
  searchingLabel: string;
  noMatchesLabel: string;
  matchOfLabel: (match: number, total: number) => string;
  matchOnPageLabel: (match: number, total: number, page: number) => string;
  previousMatchLabel: string;
  nextMatchLabel: string;
  closeSearchLabel: string;
  matchCaseLabel: string;
  wholeWordsLabel: string;
  matchAccentsLabel: string;

  /** Toolbar button that opens the markup bar, and the bar's screen reader name */
  markupLabel: string;
  markupToolLabels: Record<DocViewerMarkupTool, string>;
  undoMarkLabel: string;
  saveMarkupLabel: string;
  closeMarkupLabel: string;
  /** Screen reader name of the box a text mark is typed into */
  markupTextLabel: string;
  /** How to add or cancel the text being typed, read after the text box's name */
  markupTextKeysLabel: string;
  markupSavedLabel: string;
  /** Screen reader name of a page while a markup tool is picked, where keys place marks */
  markupLayerLabel: (tool: string, page: number) => string;
  /** How to place marks with the keyboard, read after the page's markup name */
  markupKeysLabel: string;
  markStartedLabel: (tool: string) => string;
  markAddedLabel: (tool: string) => string;
  markCancelledLabel: string;
  /** Screen reader name of the hidden list of a page's marks */
  pageMarksLabel: (page: number, count: number) => string;
  /** A text mark in that list, after the tool's name */
  textMarkLabel: (tool: string, text: string) => string;

  wrapLinesLabel: string;
  doNotWrapLinesLabel: string;
  jsonViewLabel: string;
  treeLabel: string;
  codeLabel: string;
  markdownViewLabel: string;
  previewLabel: string;
  sourceLabel: string;
  opensInNewTabLabel: string;

  pdfWorkerMissingLabel: string;

  /** Shown for a PDF when no `DocViewerAdapterProvider` gives a PDF engine */
  pdfNotConfiguredLabel: string;
  pdfErrorLabel: string;
  imageErrorLabel: string;
  textErrorLabel: string;
  markdownErrorLabel: string;
  tooLargeLabel: (size: string) => string;
  unsupportedLabel: string;
  notSupportedYetLabel: (type: string) => string;
}

export const DEFAULT_LABELS: DocViewerLabels = {
  documentLabel: 'Document',
  toolbarLabel: 'Document toolbar',
  imageLabel: 'Image',

  downloadLabel: 'Download',
  downloadFileLabel: 'Download file',
  printLabel: 'Print',
  presentationLabel: 'Presentation',
  exitPresentationLabel: 'Exit presentation',
  presentationStartedLabel: 'Presentation started, press Escape to exit',
  fullscreenLabel: 'Full screen',
  exitFullscreenLabel: 'Exit full screen',
  loadingLabel: 'Loading document',

  zoomInLabel: 'Zoom in',
  zoomOutLabel: 'Zoom out',
  resetZoomLabel: 'Reset zoom to 100%',
  zoomLevelLabel: (percent) => `Zoom ${percent}`,
  fitToWidthLabel: 'Fit to width',
  fitToViewLabel: 'Fit to view',
  rotateLabel: 'Rotate',

  pageThumbnailsLabel: 'Page thumbnails',
  showPagesLabel: 'Show pages',
  hidePagesLabel: 'Hide pages',
  pagesLabel: 'Pages',
  outlineLabel: 'Outline',
  documentInfoLabel: 'Document info',
  propertiesLabel: 'Properties',
  propertyNameLabels: {
    title: 'Title',
    author: 'Author',
    subject: 'Subject',
    keywords: 'Keywords',
    creator: 'Created with',
    producer: 'PDF producer',
    created: 'Created',
    modified: 'Modified',
    pdfVersion: 'PDF version',
    fileSize: 'File size',
    pageCount: 'Pages',
    pageSize: 'Page size',
  },
  attachmentsLabel: 'Attachments',
  downloadAttachmentLabel: (fileName) => `Download attachment ${fileName}`,
  layersLabel: 'Layers',
  noOutlineLabel: 'This document has no outline',
  pageLayoutLabel: 'Page layout',
  layoutSingleLabel: 'Single pages',
  layoutTwoPageLabel: 'Two pages',
  layoutTwoPageCoverLabel: 'Two pages, cover on its own',
  layoutHorizontalLabel: 'Horizontal scrolling',
  layoutWrappedLabel: 'Wrapped',
  passwordRequiredLabel: 'This PDF is protected with a password',
  passwordIncorrectLabel: 'The password is incorrect',
  passwordLabel: 'Password',
  unlockLabel: 'Open',
  thumbnailsPositionLabel: 'Pages panel position',
  leftLabel: 'Left',
  rightLabel: 'Right',
  topLabel: 'Top',
  bottomLabel: 'Bottom',
  previousPageLabel: 'Previous page',
  nextPageLabel: 'Next page',
  pageOfLabel: (page, total) => `Page ${page} of ${total}`,
  pageHasNoTextLabel: 'No text on this page',
  thumbnailLabel: (page) => `Page ${page}`,
  linkToPageLabel: (page) => `Go to page ${page}`,

  searchLabel: 'Search',
  searchDocumentLabel: 'Search document',
  searchingLabel: 'Searching…',
  noMatchesLabel: 'No matches',
  matchOfLabel: (match, total) => `${match} of ${total}`,
  matchOnPageLabel: (match, total, page) => `Match ${match} of ${total}, page ${page}`,
  previousMatchLabel: 'Previous match',
  nextMatchLabel: 'Next match',
  closeSearchLabel: 'Close search',
  matchCaseLabel: 'Match case',
  wholeWordsLabel: 'Whole words',
  matchAccentsLabel: 'Match accents',
  markupLabel: 'Markup',
  markupToolLabels: {
    highlight: 'Highlight',
    pen: 'Pen',
    text: 'Text box',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    cloud: 'Cloud',
    signature: 'Signature',
  },
  undoMarkLabel: 'Undo',
  saveMarkupLabel: 'Save',
  closeMarkupLabel: 'Close markup',
  markupTextLabel: 'Text box text',
  markupTextKeysLabel: 'Control or Command with Enter adds the text, Escape cancels.',
  markupSavedLabel: 'Markup saved',
  markupLayerLabel: (tool, page) => `${tool} on page ${page}`,
  markupKeysLabel:
    'Arrow keys move the cursor. Enter starts and finishes a mark or opens a text box, Shift with arrow keys draws from the cursor, Escape cancels. Page Up and Page Down go to the previous and next page.',
  markStartedLabel: (tool) => `${tool} started`,
  markAddedLabel: (tool) => `${tool} added`,
  markCancelledLabel: 'Mark cancelled',
  pageMarksLabel: (page, count) => `Page ${page}: ${count} ${count === 1 ? 'mark' : 'marks'}`,
  textMarkLabel: (tool, text) => `${tool}: ${text}`,

  wrapLinesLabel: 'Wrap lines',
  doNotWrapLinesLabel: 'Do not wrap lines',
  jsonViewLabel: 'JSON view',
  treeLabel: 'Tree',
  codeLabel: 'Code',
  markdownViewLabel: 'Markdown view',
  previewLabel: 'Preview',
  sourceLabel: 'Source',
  opensInNewTabLabel: '(opens in new tab)',

  pdfWorkerMissingLabel: 'PDF preview is not configured: pass workerSrc to createPdfJsAdapter',
  pdfNotConfiguredLabel: 'This PDF cannot be shown here. Download it instead.',
  pdfErrorLabel: 'This PDF could not be opened',
  imageErrorLabel: 'This image could not be loaded',
  textErrorLabel: 'This file could not be loaded',
  markdownErrorLabel: 'Markdown preview could not be loaded',
  tooLargeLabel: (size) => `This file is too large to preview (${size})`,
  unsupportedLabel: 'Preview is not available for this file type',
  notSupportedYetLabel: (type) => `Preview for ${type} files is not available yet`,
};

const NESTED_LABELS = ['propertyNameLabels', 'markupToolLabels'] as const;

/** Labels with `overrides` laid over `defaults`; the nested records are merged one level deep */
export function mergeLabels(
  defaults: DocViewerLabels,
  ...overrides: (Partial<DocViewerLabels> | undefined)[]
): DocViewerLabels {
  return overrides.reduce<DocViewerLabels>((merged, override) => {
    const next = { ...merged, ...override };
    NESTED_LABELS.forEach((key) => {
      Object.assign(next, { [key]: { ...merged[key], ...override?.[key] } });
    });
    return next;
  }, defaults);
}
