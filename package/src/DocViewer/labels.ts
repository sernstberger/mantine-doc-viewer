/** Text shown or read out by the viewer, override any of it with the `labels` prop to translate it */
export interface DocViewerLabels {
  /** Name used when the file has no name, for the title and the screen reader name of the viewer */
  document: string;

  /** Alternative text of images when neither `alt` nor `fileName` is set */
  image: string;

  download: string;
  downloadFile: string;
  loading: string;

  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  fitToWidth: string;
  fitToView: string;
  rotate: string;

  pageThumbnails: string;
  showPages: string;
  hidePages: string;
  pages: string;
  thumbnailsPosition: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
  previousPage: string;
  nextPage: string;
  pageOf: (page: number, total: number) => string;
  goToPage: (page: number) => string;

  search: string;
  searchDocument: string;
  searching: string;
  noMatches: string;
  matchOf: (match: number, total: number) => string;
  matchOnPage: (match: number, total: number, page: number) => string;
  previousMatch: string;
  nextMatch: string;
  closeSearch: string;

  wrapLines: string;
  doNotWrapLines: string;
  jsonView: string;
  tree: string;
  code: string;
  markdownView: string;
  preview: string;
  source: string;
  opensInNewTab: string;

  pdfWorkerMissing: string;
  pdfError: string;
  imageError: string;
  textError: string;
  markdownError: string;
  tooLarge: (size: string) => string;
  unsupported: string;
  notSupportedYet: (type: string) => string;
}

export const DEFAULT_LABELS: DocViewerLabels = {
  document: 'Document',
  image: 'Image',

  download: 'Download',
  downloadFile: 'Download file',
  loading: 'Loading document',

  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetZoom: 'Reset zoom to 100%',
  fitToWidth: 'Fit to width',
  fitToView: 'Fit to view',
  rotate: 'Rotate',

  pageThumbnails: 'Page thumbnails',
  showPages: 'Show pages',
  hidePages: 'Hide pages',
  pages: 'Pages',
  thumbnailsPosition: 'Pages panel position',
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageOf: (page, total) => `Page ${page} of ${total}`,
  goToPage: (page) => `Go to page ${page}`,

  search: 'Search',
  searchDocument: 'Search document',
  searching: 'Searching…',
  noMatches: 'No matches',
  matchOf: (match, total) => `${match} of ${total}`,
  matchOnPage: (match, total, page) => `Match ${match} of ${total}, page ${page}`,
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  closeSearch: 'Close search',

  wrapLines: 'Wrap lines',
  doNotWrapLines: 'Do not wrap lines',
  jsonView: 'JSON view',
  tree: 'Tree',
  code: 'Code',
  markdownView: 'Markdown view',
  preview: 'Preview',
  source: 'Source',
  opensInNewTab: '(opens in new tab)',

  pdfWorkerMissing: 'PDF preview is not configured: set the pdfWorkerSrc prop',
  pdfError: 'This PDF could not be opened',
  imageError: 'This image could not be loaded',
  textError: 'This file could not be loaded',
  markdownError: 'Markdown preview could not be loaded',
  tooLarge: (size) => `This file is too large to preview (${size})`,
  unsupported: 'Preview is not available for this file type',
  notSupportedYet: (type) => `Preview for ${type} files is not available yet`,
};
