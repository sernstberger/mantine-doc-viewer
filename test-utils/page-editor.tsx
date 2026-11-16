import { render, screen } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ReactNode } from 'react';
import { createTestPdfAdapter } from './adapters';
import { mockPdf } from './mock-pdf';
import { DocViewer } from '../package/src/DocViewer';
import { DocViewerAdapterProvider } from '../package/src/DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerProps } from '../package/src/DocViewerBase';
import { DocViewerRoot } from '../package/src/DocViewerRoot/DocViewerRoot';
import {
  PdfSessionContext,
  type PdfSession,
} from '../package/src/DocViewerRoot/pdf-session-context';
import { DEFAULT_LABELS } from '../package/src/DocViewerPageEditor/default-labels';
import {
  createPageEditorExtension,
  type DocViewerPageEditorOptions,
} from '../package/src/DocViewerPageEditor/page-editor-extension';
import {
  PageEditorContext,
  type PageEditorContextValue,
} from '../package/src/DocViewerPageEditor/page-editor-setup';

const pdfAdapter = createTestPdfAdapter('/worker.mjs');

export interface EditorViewerProps extends Partial<DocViewerProps> {
  /** Options of the page editor extension, `false` for a viewer without it */
  editor?: DocViewerPageEditorOptions | false;
}

/** The simple `DocViewer` of a PDF with the page editor extension, inside the test adapter */
export function EditorViewer({ editor = {}, ...props }: EditorViewerProps) {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter}>
      <DocViewer
        src="/files/report.pdf"
        extensions={editor ? [createPageEditorExtension(editor)] : []}
        {...props}
      />
    </DocViewerAdapterProvider>
  );
}

/** The editor's list of pages, with helpers to read its order, options and tab stop */
export function editorPages() {
  const listbox = screen.getByRole('listbox', { name: 'Pages' });
  const items = () => within(listbox).getAllByRole('option');
  return {
    listbox,
    items,
    order: () => items().map((option) => option.getAttribute('data-page')),
    option: (page: number) =>
      within(listbox).getByRole('option', { name: new RegExp(`^Page ${page},`) }),
    stop: () =>
      items()
        .find((tile) => tile.getAttribute('tabindex') === '0')
        ?.getAttribute('data-page'),
  };
}

/** Renders a 3 page PDF with the editor and opens the editor with its toolbar button */
export async function openEditor({
  editor,
  ...others
}: Partial<DocViewerProps> & { editor?: DocViewerPageEditorOptions } = {}) {
  mockPdf();
  const onDocumentChange = jest.fn();
  const onExtract = jest.fn();
  render(<EditorViewer editor={{ onDocumentChange, onExtract, ...editor }} {...others} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  return { ...editorPages(), onDocumentChange, onExtract };
}

/**
 * A loaded document for the parts' context container, without pdf.js. Its pages never load, so
 * a test that renders once ends with nothing left to update
 */
export function createReadySession(numPages = 2) {
  const document = { numPages, getPage: () => new Promise(() => {}) };
  return {
    loaded: { ready: { document: document as unknown as PDFDocumentProxy } },
    actions: { showBytes: jest.fn() },
  } as unknown as PdfSession;
}

/** A page editor context that is open, for the parts' context container */
export function createEditorContext(
  overrides: Partial<PageEditorContextValue> = {}
): PageEditorContextValue {
  return {
    compact: false,
    labels: DEFAULT_LABELS,
    editing: true,
    open: jest.fn(),
    close: jest.fn(),
    save: jest.fn(),
    editPagesRef: jest.fn(),
    ...overrides,
  };
}

interface EditorPartsProviderProps {
  children: ReactNode;
  session?: PdfSession;
  editor?: PageEditorContextValue;
}

/**
 * A Root with a loaded PDF and an open page editor, rendered at once: for the Styles API and
 * system props tests of the editor parts
 */
export function EditorPartsProvider({
  children,
  session = createReadySession(),
  editor = createEditorContext(),
}: EditorPartsProviderProps) {
  return (
    <DocViewerRoot src="/files/report.pdf">
      <PdfSessionContext value={session}>
        <PageEditorContext value={editor}>{children}</PageEditorContext>
      </PdfSessionContext>
    </DocViewerRoot>
  );
}
