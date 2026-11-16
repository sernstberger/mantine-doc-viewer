/** Text shown or read out by the viewer, override any of it with the `labels` prop to translate it */
export interface DocViewerLabels {
  /** Name used when the file has no name, for the title and the screen reader name of the viewer */
  documentLabel: string;

  /** Accessible label of the toolbar */
  toolbarLabel: string;

  /** Alternative text of images when neither `alt` nor `fileName` is set */
  imageLabel: string;

  /** Label of the download toolbar button */
  downloadLabel: string;

  /** Accessible label of the download link shown when a file cannot be previewed */
  downloadFileLabel: string;

  /** Label of the print toolbar button */
  printLabel: string;

  /** Label of the presentation toolbar button */
  enterPresentationLabel: string;

  /** Accessible label of the button that leaves a presentation */
  exitPresentationLabel: string;

  /** Read out when a presentation starts */
  presentationStartedLabel: string;

  /** Label of the full screen toolbar button when the viewer is not full screen */
  enterFullscreenLabel: string;

  /** Label of the full screen toolbar button when the viewer is full screen */
  exitFullscreenLabel: string;

  /** Accessible label of the loading indicator */
  loadingLabel: string;

  /** Label of the zoom in button */
  zoomInLabel: string;

  /** Label of the zoom out button */
  zoomOutLabel: string;

  /** Label of the button that resets the zoom to 100% */
  resetZoomLabel: string;

  /** Read out after zooming, with the zoom as a percentage */
  zoomLevelLabel: (percent: string) => string;

  /** Label of the zoom preset that fits the page to the width of the viewer */
  fitToWidthLabel: string;

  /** Label of the zoom preset that fits the whole page in the viewer */
  fitToViewLabel: string;

  /** Label of the rotate toolbar button */
  rotateLabel: string;

  /** Accessible label of the thumbnails toolbar button */
  pageThumbnailsLabel: string;

  /** Tooltip of the thumbnails toolbar button when the thumbnails are hidden */
  showThumbnailsLabel: string;

  /** Tooltip of the thumbnails toolbar button when the thumbnails are shown */
  hideThumbnailsLabel: string;

  /** Accessible label of the list of page thumbnails */
  pagesLabel: string;

  /** Label of the outline toolbar button and of the outline panel */
  outlineLabel: string;

  /** Label of the document info toolbar button and of its panel */
  documentInfoLabel: string;

  /** Heading of the list of document properties */
  propertiesLabel: string;

  /** Names of the PDF properties in the document info panel */
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

  /** Heading of the list of files attached to a PDF */
  attachmentsLabel: string;

  /** Accessible label of the button that downloads an attached file */
  downloadAttachmentLabel: (fileName: string) => string;

  /** Heading of the list of optional content layers of a PDF */
  layersLabel: string;

  /** Shown in the outline panel when the document has no outline */
  noOutlineLabel: string;

  /** Label of the page layout menu */
  pageLayoutLabel: string;

  /** Page layout option: one page after another */
  layoutSingleLabel: string;

  /** Page layout option: pages side by side in pairs */
  layoutTwoPageLabel: string;

  /** Page layout option: pages in pairs with the first page on its own */
  layoutTwoPageCoverLabel: string;

  /** Page layout option: pages side by side in one scrolling row */
  layoutHorizontalLabel: string;

  /** Page layout option: pages wrapped into rows that fit the viewer */
  layoutWrappedLabel: string;

  /** Shown above the password field of a protected PDF */
  passwordRequiredLabel: string;

  /** Shown when the password of a protected PDF was wrong */
  passwordIncorrectLabel: string;

  /** Accessible label of the password field */
  passwordLabel: string;

  /** Label of the button that submits the password */
  unlockLabel: string;

  /** Label of the menu that moves the thumbnails to another side */
  thumbnailsPositionLabel: string;

  /** Thumbnails position option: left side */
  leftLabel: string;

  /** Thumbnails position option: right side */
  rightLabel: string;

  /** Thumbnails position option: top */
  topLabel: string;

  /** Thumbnails position option: bottom */
  bottomLabel: string;

  /** Label of the previous page button */
  previousPageLabel: string;

  /** Label of the next page button */
  nextPageLabel: string;

  /** Read out when the page changes, with the page and the number of pages */
  pageOfLabel: (page: number, total: number) => string;

  /** Read inside a page that has no text layer, such as a scanned page */
  pageHasNoTextLabel: string;

  /** Screen reader name of a page thumbnail */
  thumbnailLabel: (page: number) => string;

  /** Screen reader name of a link inside a PDF that goes to another page */
  linkToPageLabel: (page: number) => string;

  /** Label of the search toolbar button */
  searchLabel: string;

  /** Accessible label of the search field */
  searchDocumentLabel: string;

  /** Read out while a search is running */
  searchingLabel: string;

  /** Shown when a search finds nothing */
  noMatchesLabel: string;

  /** Position of the active match among all matches */
  matchOfLabel: (match: number, total: number) => string;

  /** Read out for the active match, with its position and its page */
  matchOnPageLabel: (match: number, total: number, page: number) => string;

  /** Label of the previous match button */
  previousMatchLabel: string;

  /** Label of the next match button */
  nextMatchLabel: string;

  /** Label of the button that closes the search bar */
  closeSearchLabel: string;

  /** Label of the search option that makes upper and lower case matter */
  matchCaseLabel: string;

  /** Label of the search option that finds whole words only */
  wholeWordsLabel: string;

  /** Label of the search option that makes accents matter */
  matchAccentsLabel: string;

  /** Label of the button that wraps long lines of a text file */
  wrapLinesLabel: string;

  /** Label of the button that stops wrapping long lines of a text file */
  doNotWrapLinesLabel: string;

  /** Accessible label of the view mode control of a JSON file */
  jsonViewLabel: string;

  /** View mode of a JSON file: collapsible tree */
  treeLabel: string;

  /** View mode of a JSON file: highlighted code */
  codeLabel: string;

  /** Accessible label of the view mode control of a Markdown file */
  markdownViewLabel: string;

  /** View mode of a Markdown file: rendered text */
  previewLabel: string;

  /** View mode of a Markdown file: source text */
  sourceLabel: string;

  /** Read out after a link that opens a new tab */
  opensInNewTabLabel: string;

  /** Shown for a PDF when the PDF engine has no `workerSrc` */
  pdfWorkerMissingLabel: string;

  /** Shown for a PDF when no `DocViewerAdapterProvider` gives a PDF engine */
  pdfNotConfiguredLabel: string;

  /** Shown when a PDF cannot be opened */
  pdfErrorLabel: string;

  /** Shown when an image cannot be loaded */
  imageErrorLabel: string;

  /** Shown when a text file cannot be loaded */
  textErrorLabel: string;

  /** Shown when a Markdown file cannot be rendered */
  markdownErrorLabel: string;

  /** Shown when a file is larger than `maxSize`, with its size */
  tooLargeLabel: (size: string) => string;

  /** Shown when the file type has no preview */
  unsupportedLabel: string;

  /** Shown when the file type has no preview yet, with the type */
  notSupportedYetLabel: (type: string) => string;
}

/** Labels to lay over `DEFAULT_LABELS`: any of them, and any of the property names */
export type DocViewerLabelsInput = Partial<Omit<DocViewerLabels, 'propertyNameLabels'>> & {
  propertyNameLabels?: Partial<DocViewerLabels['propertyNameLabels']>;
};

export const DEFAULT_LABELS: DocViewerLabels = {
  documentLabel: 'Document',
  toolbarLabel: 'Document toolbar',
  imageLabel: 'Image',

  downloadLabel: 'Download',
  downloadFileLabel: 'Download file',
  printLabel: 'Print',
  enterPresentationLabel: 'Presentation',
  exitPresentationLabel: 'Exit presentation',
  presentationStartedLabel: 'Presentation started, press Escape to exit',
  enterFullscreenLabel: 'Full screen',
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
  showThumbnailsLabel: 'Show thumbnails',
  hideThumbnailsLabel: 'Hide thumbnails',
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

/** Labels with `overrides` laid over `defaults`; `propertyNameLabels` is merged one level deep */
export function mergeLabels(
  defaults: DocViewerLabels,
  ...overrides: (DocViewerLabelsInput | undefined)[]
): DocViewerLabels {
  return overrides.reduce<DocViewerLabels>(
    (merged, override) => ({
      ...merged,
      ...override,
      propertyNameLabels: { ...merged.propertyNameLabels, ...override?.propertyNameLabels },
    }),
    defaults
  );
}
