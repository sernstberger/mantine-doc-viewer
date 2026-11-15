import { DEFAULT_LABELS as CORE_LABELS, type DocViewerLabels } from '../default-labels';

const PAGE_EDITOR_LABEL_KEYS = [
  'editPagesLabel',
  'moveEarlierLabel',
  'moveLaterLabel',
  'deletePagesLabel',
  'deletePageLabel',
  'extractPagesLabel',
  'rotatePagesLabel',
  'resetPagesLabel',
  'cancelLabel',
  'doneLabel',
  'savePagesLabel',
  'selectedCountLabel',
  'editorPageLabel',
  'pageMovedLabel',
  'pagesRemovedLabel',
  'pagesRotatedLabel',
] as const;

/** Text of the page editor, override any of it with the extension's `labels` option */
export type DocViewerPageEditorLabels = Pick<
  DocViewerLabels,
  (typeof PAGE_EDITOR_LABEL_KEYS)[number]
>;

export const DEFAULT_LABELS = Object.fromEntries(
  PAGE_EDITOR_LABEL_KEYS.map((key) => [key, CORE_LABELS[key]])
) as unknown as DocViewerPageEditorLabels;
