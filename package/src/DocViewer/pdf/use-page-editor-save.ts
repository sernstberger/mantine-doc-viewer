import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useState } from 'react';
import { buildExtractRequest, PageOrder } from './page-edits';
import { applyPageRotations } from './rotate-pages';
import type { PdfSaveReason } from './PdfPageEditor';

interface PageEditorSaveInput {
  document: PDFDocumentProxy;
  turnOf: (page: number) => number;
  /** Ends editing: with the edited document's bytes, or null when nothing changed */
  onDone: (bytes: Uint8Array | null) => void;
  onSave: (bytes: Uint8Array, reason: PdfSaveReason, pages: number[]) => Promise<void> | void;
}

/** Making the edited document, with `busy` set while an action that does so runs */
export function usePageEditorSave({ document, turnOf, onDone, onSave }: PageEditorSaveInput) {
  const [busy, setBusy] = useState(false);

  /** The document with these pages in this order, turned as the reader turned them */
  const build = async (pages: PageOrder) =>
    applyPageRotations(
      (await document.extractPages(buildExtractRequest(pages))) as Uint8Array,
      pages.map(turnOf)
    );

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    /** Save just these pages as their own document */
    extract: (selection: PageOrder) =>
      run(async () => onSave(await build(selection), 'extract', selection)),
    /** End editing with the edited document, or with null when nothing changed */
    finish: (order: PageOrder, edited: boolean) =>
      run(async () => onDone(edited ? await build(order) : null)),
    /** Save the edited document, then end editing with it */
    save: (order: PageOrder) =>
      run(async () => {
        const bytes = await build(order);
        await onSave(bytes, 'save', order);
        onDone(bytes);
      }),
  };
}
