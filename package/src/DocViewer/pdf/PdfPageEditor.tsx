import { VisuallyHidden } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { EditorBar } from './PdfEditorBar';
import { PageTile } from './PdfPageTile';
import { usePageEditorKeys } from './use-page-editor-keys';
import { usePageEditorSave } from './use-page-editor-save';
import { usePageEditorState } from './use-page-editor-state';

export type PdfSaveReason = 'save' | 'extract' | 'reorder' | 'delete' | 'annotate';

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
  const handleKeyDown = usePageEditorKeys(editor);

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

      <div
        ref={setScrollRoot}
        {...getStyles('editorPages')}
        role="listbox"
        aria-multiselectable
        aria-label={labels.pages}
        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete Space R Control+A"
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
            reorder={reorder}
            onSelect={(event) => editor.select(page, index, event)}
          />
        ))}
      </div>

      <VisuallyHidden role="status">{editor.announcement}</VisuallyHidden>
    </div>
  );
}
