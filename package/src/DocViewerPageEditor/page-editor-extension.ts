import type { DocViewerExtension } from '../doc-viewer.types';
import type { DocViewerPageEditorLabels } from './default-labels';
import { DocViewerPageEditorButton } from './DocViewerPageEditorButton/DocViewerPageEditorButton';
import { EDIT_PAGES_MODE, PageEditorSetup } from './page-editor-setup';
import { PageEditorScreen, ThumbnailDeleteAction } from './PageEditorScreen';

export interface DocViewerPageEditorOptions {
  /** Buttons show only icons, labels in tooltips, `false` by default */
  compact?: boolean;

  /** Thumbnails can be dragged to reorder and deleted, `true` by default */
  withThumbnailEditing?: boolean;

  /** Bytes of the changed document; without it a save downloads the document and a reorder or delete only changes what is shown */
  onDocumentChange?: (
    bytes: Uint8Array,
    details: { reason: 'save' | 'reorder' | 'delete'; pages: number[] }
  ) => void | Promise<void>;

  /** Bytes of extracted pages; without it they are downloaded */
  onExtract?: (bytes: Uint8Array, details: { pages: number[] }) => void | Promise<void>;

  /** Text of the page editor, merged with `DEFAULT_LABELS` of `mantine-doc-viewer/editor` */
  labels?: Partial<DocViewerPageEditorLabels>;
}

/** Page editor for `extensions`: reorder, rotate, remove and extract PDF pages */
export function createPageEditorExtension(
  options: DocViewerPageEditorOptions = {}
): DocViewerExtension {
  return {
    name: 'page-editor',
    options,
    setup: PageEditorSetup,
    toolbarControls: [
      { control: 'editPages', after: 'presentation', Component: DocViewerPageEditorButton },
    ],
    thumbnail: { action: ThumbnailDeleteAction },
    screen: { mode: EDIT_PAGES_MODE, Component: PageEditorScreen },
  };
}
