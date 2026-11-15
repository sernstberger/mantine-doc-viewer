import { Box, BoxProps, ElementProps, VisuallyHidden } from '@mantine/core';
import { useCallbackRef } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect, useState } from 'react';
import { focusIfLost } from '../utils/a11y';
import { EditorBar } from './EditorBar';
import { usePageEditorKeys } from './hooks/use-page-editor-keys';
import { usePageEditorSave } from './hooks/use-page-editor-save';
import { usePageEditorState } from './hooks/use-page-editor-state';
import { usePageEditor } from './page-editor-setup';
import { usePageEditorStyles } from './page-editor-styles';
import { PageTile } from './PageTile';
import type { PdfSaveReason } from './utils/page-edits';

interface PageEditorViewProps extends BoxProps, Omit<ElementProps<'div'>, 'onCancel'> {
  ref?: React.Ref<HTMLDivElement>;
  document: PDFDocumentProxy;

  /** Ends editing: with the edited document's bytes, or null when nothing changed */
  onDone: (bytes: Uint8Array | null) => void;
  onCancel: () => void;
  onSave: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void> | void;
}

/**
 * Reorder, remove and extract pages. Edits make a new document; the original file is not changed.
 * The page list is an ARIA listbox with a roving tab stop: the focused page takes focus, not the list
 */
export function PageEditorView({
  document,
  onDone,
  onCancel,
  onSave,
  ...others
}: PageEditorViewProps) {
  const getStyles = usePageEditorStyles();
  const { labels } = usePageEditor()!;
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const editor = usePageEditorState({ document, scrollRoot, labels });
  const { order, selected, selection, edited, reorder } = editor;
  const { busy, extract, finish, save } = usePageEditorSave({
    document,
    turnOf: editor.turnOf,
    onDone,
    onSave,
  });
  const handleKeyDown = usePageEditorKeys(editor, onCancel);
  const select = useCallbackRef(editor.select);

  useEffect(() => {
    focusIfLost(scrollRoot?.querySelector<HTMLElement>('[tabindex="0"]'));
  }, [scrollRoot]);

  return (
    <Box {...others}>
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
    </Box>
  );
}
