import type {
  DocViewerPageEditorButtonFactory,
  DocViewerPageEditorButtonProps,
  DocViewerPageEditorButtonStylesNames,
} from './DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton.js';
import type {
  DocViewerPageEditorFactory,
  DocViewerPageEditorProps,
  DocViewerPageEditorStylesNames,
} from './DocViewerPageEditor/DocViewerPageEditor.js';
import type { DocViewerPageEditorLabels } from './DocViewerPageEditor/default-labels.js';
import type { DocViewerPageEditorOptions } from './DocViewerPageEditor/page-editor-extension.js';

export { DocViewerPageEditor } from './DocViewerPageEditor/DocViewerPageEditor.js';
export { DocViewerPageEditorButton } from './DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton.js';
export { createPageEditorExtension } from './DocViewerPageEditor/page-editor-extension.js';
export { openPageEditor, closePageEditor } from './DocViewerPageEditor/page-editor-actions.js';
export { DEFAULT_LABELS } from './DocViewerPageEditor/default-labels.js';

export type {
  DocViewerPageEditorFactory,
  DocViewerPageEditorProps,
  DocViewerPageEditorStylesNames,
  DocViewerPageEditorButtonFactory,
  DocViewerPageEditorButtonProps,
  DocViewerPageEditorButtonStylesNames,
  DocViewerPageEditorLabels,
  DocViewerPageEditorOptions,
};
