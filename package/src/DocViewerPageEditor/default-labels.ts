/** Text shown or read out by the page editor, override any of it with the extension's `labels` option */
export interface DocViewerPageEditorLabels {
  /** Toolbar button that opens the editor, and the editor's title */
  editPagesLabel: string;
  /** Label of the button that moves the selected pages earlier */
  moveEarlierLabel: string;
  /** Label of the button that moves the selected pages later */
  moveLaterLabel: string;
  /** Label of the button that deletes the selected pages */
  deletePagesLabel: string;
  /** Delete button on a thumbnail */
  deletePageLabel: (page: number) => string;
  /** Label of the button that extracts the selected pages into a new file */
  extractPagesLabel: string;
  /** Label of the button that turns the selected pages */
  rotatePagesLabel: string;
  /** Label of the button that undoes all page edits */
  resetPagesLabel: string;
  /** Label of the button that leaves the editor without keeping the edits */
  cancelLabel: string;
  /** Label of the button that leaves the editor and keeps the edits */
  doneLabel: string;
  /** Label of the button that saves the edited document */
  savePagesLabel: string;
  /** Screen reader name of the editor's list of pages */
  pagesLabel: string;
  /** Shown while pages are selected, with the number of selected pages */
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
