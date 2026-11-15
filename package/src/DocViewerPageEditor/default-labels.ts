/** Text shown or read out by the page editor, override any of it with the extension's `labels` option */
export interface DocViewerPageEditorLabels {
  /** Toolbar button that opens the editor, and the editor's title */
  editPagesLabel: string;
  moveEarlierLabel: string;
  moveLaterLabel: string;
  deletePagesLabel: string;
  /** Delete button on a thumbnail */
  deletePageLabel: (page: number) => string;
  extractPagesLabel: string;
  rotatePagesLabel: string;
  resetPagesLabel: string;
  cancelLabel: string;
  doneLabel: string;
  savePagesLabel: string;
  /** Screen reader name of the editor's list of pages */
  pagesLabel: string;
  selectedCountLabel: (count: number) => string;
  /** Screen reader name of a page in the editor */
  editorPageLabel: (page: number, position: number, total: number) => string;
  /** Read out after a page moved */
  pageMovedLabel: (page: number, position: number) => string;
  /** Read out after pages were removed */
  pagesRemovedLabel: (count: number) => string;
  /** Read out after pages were turned */
  pagesRotatedLabel: (count: number) => string;
}

export const DEFAULT_LABELS: DocViewerPageEditorLabels = {
  editPagesLabel: 'Edit pages',
  moveEarlierLabel: 'Move earlier',
  moveLaterLabel: 'Move later',
  deletePagesLabel: 'Delete',
  deletePageLabel: (page) => `Delete page ${page}`,
  extractPagesLabel: 'Extract selected',
  rotatePagesLabel: 'Rotate',
  resetPagesLabel: 'Reset',
  cancelLabel: 'Cancel',
  doneLabel: 'Done',
  savePagesLabel: 'Save',
  pagesLabel: 'Pages',
  selectedCountLabel: (count) => `${count} selected`,
  editorPageLabel: (page, position, total) => `Page ${page}, position ${position} of ${total}`,
  pageMovedLabel: (page, position) => `Page ${page} moved to position ${position}`,
  pagesRemovedLabel: (count) => (count === 1 ? '1 page removed' : `${count} pages removed`),
  pagesRotatedLabel: (count) => (count === 1 ? '1 page turned' : `${count} pages turned`),
};
