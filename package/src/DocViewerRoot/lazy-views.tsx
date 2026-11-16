import { lazy, type ReactNode, Suspense } from 'react';
import { importCodeView, importMarkdownView } from './import-views';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';

/**
 * The code and markdown views load on demand, like pdf.js and react-markdown: they bring
 * @mantine/code-highlight, which an app that only shows PDFs and images never needs
 */
export const CodeView = lazy(() =>
  importCodeView().then((module) => ({ default: module.CodeView }))
);

export const MarkdownView = lazy(() =>
  importMarkdownView().then((module) => ({ default: module.MarkdownView }))
);

/** A lazy view, with the loading message the views show while a file loads */
export function LazyView({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <DocViewerBody focusable={false}>
          <DocViewerLoading />
        </DocViewerBody>
      }
    >
      {children}
    </Suspense>
  );
}
