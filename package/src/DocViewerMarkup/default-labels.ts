import { DEFAULT_LABELS as CORE_LABELS, type DocViewerLabels } from '../default-labels';

const MARKUP_LABEL_KEYS = [
  'markupLabel',
  'markupToolLabels',
  'undoMarkLabel',
  'saveMarkupLabel',
  'closeMarkupLabel',
  'markupTextLabel',
  'markupTextKeysLabel',
  'markupSavedLabel',
  'markupLayerLabel',
  'markupKeysLabel',
  'markStartedLabel',
  'markAddedLabel',
  'markCancelledLabel',
  'pageMarksLabel',
  'textMarkLabel',
] as const;

/** Text of the markup tools, override any of it with the extension's `labels` option */
export type DocViewerMarkupLabels = Pick<DocViewerLabels, (typeof MARKUP_LABEL_KEYS)[number]>;

export const DEFAULT_LABELS = Object.fromEntries(
  MARKUP_LABEL_KEYS.map((key) => [key, CORE_LABELS[key]])
) as unknown as DocViewerMarkupLabels;
