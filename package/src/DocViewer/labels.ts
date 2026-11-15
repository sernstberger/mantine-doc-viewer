import type { DocViewerMarkupTool } from './pdf/markup';

/** Text shown or read out by the viewer, override any of it with the `labels` prop to translate it */
export interface DocViewerLabels {
  /** Name used when the file has no name, for the title and the screen reader name of the viewer */
  document: string;
  toolbar: string;

  /** Alternative text of images when neither `alt` nor `fileName` is set */
  image: string;

  download: string;
  downloadFile: string;
  print: string;
  presentation: string;
  editPages: string;
  moveEarlier: string;
  moveLater: string;
  deletePages: string;
  deletePage: (page: number) => string;
  extractPages: string;
  rotatePages: string;
  resetPages: string;
  cancel: string;
  done: string;
  savePages: string;
  selectedCount: (count: number) => string;
  editorPage: (page: number, position: number, total: number) => string;
  pageMoved: (page: number, position: number) => string;
  pagesRemoved: (count: number) => string;
  pagesRotated: (count: number) => string;
  exitPresentation: string;
  fullscreen: string;
  exitFullscreen: string;
  loading: string;

  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  /** Read out after zooming, with the zoom as a percentage */
  zoomLevel: (percent: string) => string;
  fitToWidth: string;
  fitToView: string;
  rotate: string;

  pageThumbnails: string;
  showPages: string;
  hidePages: string;
  pages: string;
  outline: string;
  documentInfo: string;
  properties: string;
  propertyNames: Record<
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
  attachments: string;
  downloadAttachment: (fileName: string) => string;
  layers: string;
  noOutline: string;
  pageLayout: string;
  layoutSingle: string;
  layoutTwoPage: string;
  layoutTwoPageCover: string;
  layoutHorizontal: string;
  layoutWrapped: string;
  passwordRequired: string;
  passwordIncorrect: string;
  password: string;
  unlock: string;
  thumbnailsPosition: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
  previousPage: string;
  nextPage: string;
  pageOf: (page: number, total: number) => string;
  /** Screen reader name of a page thumbnail */
  thumbnail: (page: number) => string;
  /** Screen reader name of a link inside a PDF that goes to another page */
  linkToPage: (page: number) => string;

  search: string;
  searchDocument: string;
  searching: string;
  noMatches: string;
  matchOf: (match: number, total: number) => string;
  matchOnPage: (match: number, total: number, page: number) => string;
  previousMatch: string;
  nextMatch: string;
  closeSearch: string;
  matchCase: string;
  wholeWords: string;
  matchAccents: string;

  /** Toolbar button that opens the markup bar, and the bar's screen reader name */
  markup: string;
  markupTools: Record<DocViewerMarkupTool, string>;
  undoMark: string;
  saveMarkup: string;
  closeMarkup: string;
  /** Screen reader name of the box a text mark is typed into */
  markupText: string;
  markupSaved: string;
  /** Screen reader name of a page while a markup tool is picked, where keys place marks */
  markupLayer: (tool: string, page: number) => string;
  /** How to place marks with the keyboard, read after the page's markup name */
  markupKeys: string;
  markStarted: (tool: string) => string;
  markAdded: (tool: string) => string;
  markCancelled: string;

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
  toolbar: 'Document toolbar',
  image: 'Image',

  download: 'Download',
  downloadFile: 'Download file',
  print: 'Print',
  presentation: 'Presentation',
  editPages: 'Edit pages',
  moveEarlier: 'Move earlier',
  moveLater: 'Move later',
  deletePages: 'Delete',
  deletePage: (page) => `Delete page ${page}`,
  extractPages: 'Extract selected',
  rotatePages: 'Rotate',
  resetPages: 'Reset',
  cancel: 'Cancel',
  done: 'Done',
  savePages: 'Save',
  selectedCount: (count) => `${count} selected`,
  editorPage: (page, position, total) => `Page ${page}, position ${position} of ${total}`,
  pageMoved: (page, position) => `Page ${page} moved to position ${position}`,
  pagesRemoved: (count) => (count === 1 ? '1 page removed' : `${count} pages removed`),
  pagesRotated: (count) => (count === 1 ? '1 page turned' : `${count} pages turned`),
  exitPresentation: 'Exit presentation',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  loading: 'Loading document',

  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetZoom: 'Reset zoom to 100%',
  zoomLevel: (percent) => `Zoom ${percent}`,
  fitToWidth: 'Fit to width',
  fitToView: 'Fit to view',
  rotate: 'Rotate',

  pageThumbnails: 'Page thumbnails',
  showPages: 'Show pages',
  hidePages: 'Hide pages',
  pages: 'Pages',
  outline: 'Outline',
  documentInfo: 'Document info',
  properties: 'Properties',
  propertyNames: {
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
  attachments: 'Attachments',
  downloadAttachment: (fileName) => `Download attachment ${fileName}`,
  layers: 'Layers',
  noOutline: 'This document has no outline',
  pageLayout: 'Page layout',
  layoutSingle: 'Single pages',
  layoutTwoPage: 'Two pages',
  layoutTwoPageCover: 'Two pages, cover on its own',
  layoutHorizontal: 'Horizontal scrolling',
  layoutWrapped: 'Wrapped',
  passwordRequired: 'This PDF is protected with a password',
  passwordIncorrect: 'The password is incorrect',
  password: 'Password',
  unlock: 'Open',
  thumbnailsPosition: 'Pages panel position',
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageOf: (page, total) => `Page ${page} of ${total}`,
  thumbnail: (page) => `Page ${page}`,
  linkToPage: (page) => `Go to page ${page}`,

  search: 'Search',
  searchDocument: 'Search document',
  searching: 'Searching…',
  noMatches: 'No matches',
  matchOf: (match, total) => `${match} of ${total}`,
  matchOnPage: (match, total, page) => `Match ${match} of ${total}, page ${page}`,
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  closeSearch: 'Close search',
  matchCase: 'Match case',
  wholeWords: 'Whole words',
  matchAccents: 'Match accents',
  markup: 'Markup',
  markupTools: {
    highlight: 'Highlight',
    pen: 'Pen',
    text: 'Text box',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    cloud: 'Cloud',
    signature: 'Signature',
  },
  undoMark: 'Undo',
  saveMarkup: 'Save',
  closeMarkup: 'Close markup',
  markupText: 'Text box text',
  markupSaved: 'Markup saved',
  markupLayer: (tool, page) => `${tool} on page ${page}`,
  markupKeys:
    'Arrow keys move the cursor. Enter starts and finishes a mark or opens a text box, Shift with arrow keys draws from the cursor, Escape cancels.',
  markStarted: (tool) => `${tool} started`,
  markAdded: (tool) => `${tool} added`,
  markCancelled: 'Mark cancelled',

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
