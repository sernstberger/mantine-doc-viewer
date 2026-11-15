import { useCallbackRef } from '@mantine/hooks';
import React, { createContext, use, useMemo } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerExtensionOptions } from '../DocViewerRoot/extensions-context';
import { getSaveHandler } from '../DocViewerRoot/get-save-handler';
import {
  PdfThumbnailEditsContext,
  usePdfSession,
  type PdfSession,
} from '../DocViewerRoot/pdf-session-context';
import { useReturnFocus } from '../hooks/pdf/use-return-focus';
import { useRegisterController } from '../hooks/use-controller-registry';
import { useDocViewerStateValue } from '../hooks/use-doc-viewer-state';
import {
  buildExtractRequest,
  initialOrder,
  movePage,
  removeSelected,
  type PdfSaveReason,
} from '../utils/page-edits';
import type { DocViewerPageEditorOptions } from './page-editor-extension';

/** The store `mode` while the page editor is open */
export const EDIT_PAGES_MODE = 'edit-pages';

interface PageEditorContextValue {
  /** Buttons show only icons */
  compact: boolean | undefined;
  editing: boolean;
  open: () => void;
  close: () => void;
  save: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void>;

  /** Ref of the Edit pages button, which takes focus back when the editor closes */
  editPagesRef: (node: HTMLElement | null) => void;
}

const PageEditorContext = createContext<PageEditorContextValue | null>(null);

/** The page editor of the viewer, null without the editor extension or outside a PDF */
export function usePageEditor() {
  return use(PageEditorContext);
}

type SaveEdit = PageEditorContextValue['save'];

/** Thumbnails drag to reorder and delete pages: the viewer shows the changed document */
function useThumbnailEdits(session: PdfSession, save: SaveEdit, enabled: boolean) {
  const { labels } = useDocViewerContext();
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

/**
 * The page editor's setup inside the PDF session: the editor mode in the store, the actions of
 * the registry, saving, and reorder and delete for the thumbnails
 */
export function PageEditorSetup({ children }: { children: React.ReactNode }) {
  const { store, controller, fileName } = useDocViewerContext();
  const session = usePdfSession()!;
  const options = useDocViewerExtensionOptions<DocViewerPageEditorOptions>('page-editor')!;
  const [mode, setMode] = useDocViewerStateValue(store, 'mode');
  const editing = mode === EDIT_PAGES_MODE;
  const ready = !!session.loaded.ready;
  const editPagesRef = useReturnFocus(editing);

  const save = useCallbackRef<SaveEdit>(async (bytes, reason, pages) => {
    await getSaveHandler({ editor: options, markup: undefined, fileName })?.(bytes, {
      reason,
      pages,
    });
  });
  const open = useCallbackRef(() => {
    ready && setMode(EDIT_PAGES_MODE);
  });
  const close = useCallbackRef(() => setMode('read'));
  useRegisterController(controller, { editPages: open, closePageEditor: close });

  const thumbnailEdits = useThumbnailEdits(session, save, options.withThumbnailEditing !== false);
  const { compact } = options;
  const value = useMemo(
    () => ({ compact, editing, open, close, save, editPagesRef }),
    [compact, editing, open, close, save, editPagesRef]
  );

  return (
    <PageEditorContext value={value}>
      <PdfThumbnailEditsContext value={thumbnailEdits}>{children}</PdfThumbnailEditsContext>
    </PageEditorContext>
  );
}
