import { useCallbackRef } from '@mantine/hooks';
import { createContext, type ReactNode, use, useMemo } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerExtensionOptions } from '../DocViewerRoot/extensions-context';
import { getSaveHandler } from './utils/get-save-handler';
import {
  PdfThumbnailEditsContext,
  usePdfSession,
  type PdfSession,
} from '../DocViewerRoot/pdf-session-context';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { useReturnFocus } from '../hooks/pdf/use-return-focus';
import { useRegisterController } from '../hooks/use-controller-registry';
import { useDocViewerStateValue } from '../hooks/use-doc-viewer-state';
import { DEFAULT_LABELS, type DocViewerPageEditorLabels } from './default-labels';
import type { DocViewerPageEditorOptions } from './page-editor-extension';
import {
  buildExtractRequest,
  initialOrder,
  movePage,
  removeSelected,
  type PdfSaveReason,
} from './utils/page-edits';

/** The store `mode` while the page editor is open */
export const EDIT_PAGES_MODE = 'edit-pages';

export interface PageEditorContextValue {
  /** Buttons show only icons */
  compact: boolean | undefined;
  labels: DocViewerPageEditorLabels;
  editing: boolean;
  open: () => void;
  close: () => void;
  save: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void>;

  /** Ref of the Edit pages button, which takes focus back when the editor closes */
  editPagesRef: (node: HTMLElement | null) => void;
}

export const PageEditorContext = createContext<PageEditorContextValue | null>(null);

/** The page editor of the viewer, null without the editor extension or outside a PDF */
export function usePageEditor() {
  return use(PageEditorContext);
}

type SaveEdit = PageEditorContextValue['save'];

/** Thumbnails drag to reorder and delete pages: the viewer shows the changed document */
function useThumbnailEdits(
  session: PdfSession,
  labels: DocViewerPageEditorLabels,
  save: SaveEdit,
  enabled: boolean
) {
  const { document, numPages } = session.loaded;
  const { showBytes } = session.actions;
  const { announce } = session.position;

  const onReorder = useCallbackRef(async (page: number, toIndex: number) => {
    const order = movePage(initialOrder(numPages), page, toIndex);
    const bytes = (await document!.extractPages(buildExtractRequest(order))) as Uint8Array;
    showBytes(bytes, toIndex + 1);
    announce(labels.pageMovedLabel(page, toIndex + 1));
    await save(bytes, 'reorder', order);
  });

  const onDelete = useCallbackRef(async (page: number) => {
    const order = removeSelected(initialOrder(numPages), new Set([page]));
    const bytes = (await document!.extractPages(buildExtractRequest(order))) as Uint8Array;
    showBytes(bytes, Math.min(page, order.length));
    announce(labels.pagesRemovedLabel(1));
    await save(bytes, 'delete', order);
  });

  return useMemo(
    () => (enabled ? { onReorder, onDelete: numPages > 1 ? onDelete : undefined } : null),
    [enabled, numPages, onReorder, onDelete]
  );
}

/** The editor's labels: `DEFAULT_LABELS` with the extension's `labels` option */
function usePageEditorLabels(overrides: Partial<DocViewerPageEditorLabels> | undefined) {
  const stable = useShallowStable(overrides);
  return useMemo(() => ({ ...DEFAULT_LABELS, ...stable }), [stable]);
}

/**
 * The page editor's setup inside the PDF session: the editor mode in the store, the actions of
 * the registry, saving, and reorder and delete for the thumbnails
 */
export function PageEditorSetup({ children }: { children: ReactNode }) {
  const { store, controller, fileName } = useDocViewerContext();
  const session = usePdfSession()!;
  const options = useDocViewerExtensionOptions<DocViewerPageEditorOptions>('page-editor')!;
  const labels = usePageEditorLabels(options.labels);
  const [mode, setMode] = useDocViewerStateValue(store, 'mode');
  const editing = mode === EDIT_PAGES_MODE;
  const ready = !!session.loaded.ready;
  const editPagesRef = useReturnFocus(editing, ready ? session.view.scrollRoot : null);

  const save = useCallbackRef<SaveEdit>(async (bytes, reason, pages) => {
    await getSaveHandler(options, fileName)(bytes, { reason, pages });
  });
  const open = useCallbackRef(() => {
    ready && setMode(EDIT_PAGES_MODE);
  });
  const close = useCallbackRef(() => setMode('read'));
  useRegisterController(controller, { editPages: open, closePageEditor: close });

  const thumbnailEdits = useThumbnailEdits(
    session,
    labels,
    save,
    options.withThumbnailEditing !== false
  );
  const { compact } = options;
  const value = useMemo(
    () => ({ compact, labels, editing, open, close, save, editPagesRef }),
    [compact, labels, editing, open, close, save, editPagesRef]
  );

  return (
    <PageEditorContext value={value}>
      <PdfThumbnailEditsContext value={thumbnailEdits}>{children}</PdfThumbnailEditsContext>
    </PageEditorContext>
  );
}
