import type {
  DocViewerMarkupBarFactory,
  DocViewerMarkupBarProps,
  DocViewerMarkupBarStylesNames,
} from './DocViewerMarkup/DocViewerMarkupBar/DocViewerMarkupBar.js';
import type {
  DocViewerMarkupButtonFactory,
  DocViewerMarkupButtonProps,
  DocViewerMarkupButtonStylesNames,
} from './DocViewerMarkup/DocViewerMarkupButton/DocViewerMarkupButton.js';
import type { DocViewerMarkupLabels } from './DocViewerMarkup/default-labels.js';
import type { DocViewerMarkupOptions } from './DocViewerMarkup/markup-extension.js';
import type {
  DocViewerHighlightMark,
  DocViewerMark,
  DocViewerMarkPoint,
  DocViewerMarkRect,
  DocViewerMarkupTool,
  DocViewerShapeMark,
  DocViewerStrokeMark,
  DocViewerTextMark,
} from './DocViewerMarkup/utils/markup.js';

export { DocViewerMarkupBar } from './DocViewerMarkup/DocViewerMarkupBar/DocViewerMarkupBar.js';
export { DocViewerMarkupButton } from './DocViewerMarkup/DocViewerMarkupButton/DocViewerMarkupButton.js';
export { createMarkupExtension } from './DocViewerMarkup/markup-extension.js';
export { setMarkupTool, saveMarkup } from './DocViewerMarkup/markup-actions.js';
export { DEFAULT_LABELS } from './DocViewerMarkup/default-labels.js';

export type {
  DocViewerMarkupBarFactory,
  DocViewerMarkupBarProps,
  DocViewerMarkupBarStylesNames,
  DocViewerMarkupButtonFactory,
  DocViewerMarkupButtonProps,
  DocViewerMarkupButtonStylesNames,
  DocViewerMarkupLabels,
  DocViewerMarkupOptions,
  DocViewerHighlightMark,
  DocViewerMark,
  DocViewerMarkPoint,
  DocViewerMarkRect,
  DocViewerMarkupTool,
  DocViewerShapeMark,
  DocViewerStrokeMark,
  DocViewerTextMark,
};
