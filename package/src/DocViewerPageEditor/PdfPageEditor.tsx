import { VisuallyHidden } from '@mantine/core';
import { useCallbackRef } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect, useState } from 'react';
import { focusIfLost } from '../utils/a11y';
import { useDocViewerContext } from '../doc-viewer.context';
import { EditorBar } from './PdfEditorBar';
import { PageTile } from './PdfPageTile';
import { usePageEditorKeys } from '../hooks/pdf/use-page-editor-keys';
import { usePageEditorSave } from '../hooks/pdf/use-page-editor-save';
import { usePageEditorState } from '../hooks/pdf/use-page-editor-state';
import type { PdfSaveReason } from '../utils/page-edits';

export type { PdfSaveReason };

interface PdfPageEditorProps {
  document: PDFDocumentProxy;

  /** Ends editing: with the edited document's bytes, or null when nothing changed */
  onDone: (bytes: Uint8Array | null) => void;
  onCancel: () => void;
  onSave: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void> | void;
}

/** Reorder, remove and extract pages. Edits make a new document; the original file is not changed */
export function PdfPageEditor({ document, onDone, onCancel, onSave }: PdfPageEditorProps) {
  const { getStyles, labels } = useDocViewerContext();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const editor = usePageEditorState({ document, scrollRoot });
  const { order, selected, selection, edited, reorder } = editor;
  const { busy, extract, finish, save } = usePageEditorSave({
    document,
    turnOf: editor.turnOf,
    onDone,
    onSave,
  });
  const handleKeyDown = usePageEditorKeys(editor, onCancel);
  // The same function on every render, so tiles skip renders their own props do not need
  const select = useCallbackRef(editor.select);

  // The editor replaces the reader and the Edit pages button with it: focus moves to the pages
  useEffect(() => {
    focusIfLost(scrollRoot?.querySelector<HTMLElement>('[tabindex="0"]'));
  }, [scrollRoot]);

  return (
    <div {...getStyles('editor')}>
      <EditorBar
        order={order}
        selection={selection}
        selectedCount={selected.size}
        edited={edited}
        busy={busy}
        onMove={editor.move}
        onRemove={editor.remove}
        onRotate={editor.rotate}
        onExtract={() => extract(selection)}
        onReset={editor.reset}
        onCancel={onCancel}
        onDone={() => finish(order, edited)}
        onSave={() => save(order)}
      />

      {/* Focus moves between the pages (roving tabindex: the focused page is the tab stop), so the
          listbox itself does not take focus, as in the ARIA listbox pattern */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={setScrollRoot}
        {...getStyles('editorPages')}
        role="listbox"
        aria-multiselectable
        aria-label={labels.pagesLabel}
        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete Space R Control+A Escape"
        onKeyDown={handleKeyDown}
        data-dragging={reorder.dragging || undefined}
      >
        {order.map((page, index) => (
          <PageTile
            key={page}
            document={document}
            page={page}
            position={index + 1}
            total={order.length}
            selected={selected.has(page)}
            focused={index === editor.focusedIndex}
            rotation={editor.turnOf(page)}
            scrollRoot={scrollRoot}
            reorder={reorder.list}
            dragState={reorder.getItemState(page, index)}
            onSelect={select}
          />
        ))}
      </div>

      <VisuallyHidden role="status">{editor.announcement}</VisuallyHidden>
    </div>
  );
}
