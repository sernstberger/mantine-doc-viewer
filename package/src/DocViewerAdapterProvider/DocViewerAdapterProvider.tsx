import { createContext, type ReactNode, use, useMemo } from 'react';
import type { DocViewerMarkdownAdapter } from './adapters/react-markdown-adapter';
import type { DocViewerPdfAdapter } from './adapters/pdfjs-adapter';

export interface DocViewerAdapters {
  pdf: DocViewerPdfAdapter | undefined;
  markdown: DocViewerMarkdownAdapter | undefined;
}

const DocViewerAdapterContext = createContext<DocViewerAdapters>({
  pdf: undefined,
  markdown: undefined,
});

export interface DocViewerAdapterProviderProps {
  /** PDF engine, from `createPdfJsAdapter`. Without it PDF files show a message with a download link */
  pdf?: DocViewerPdfAdapter;

  /** Markdown engine, from `createReactMarkdownAdapter`. Without it markdown files show their source */
  markdown?: DocViewerMarkdownAdapter;
  children: ReactNode;
}

/** Gives every viewer inside it the engines that show PDF and markdown files. Engines load when a viewer first needs them */
export function DocViewerAdapterProvider({
  pdf,
  markdown,
  children,
}: DocViewerAdapterProviderProps) {
  const value = useMemo(() => ({ pdf, markdown }), [pdf, markdown]);
  return <DocViewerAdapterContext value={value}>{children}</DocViewerAdapterContext>;
}

/** The engines of the nearest `DocViewerAdapterProvider` */
export function useDocViewerAdapters() {
  return use(DocViewerAdapterContext);
}
