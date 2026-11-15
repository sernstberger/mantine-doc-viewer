import React, { Suspense } from 'react';
import { DocViewerToolbar } from '../DocViewerToolbar/ToolbarView';
import { importCodeView, importMarkdownView } from './import-views';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { DocViewerLoading } from '../DocViewerMessage/MessageView';

/**
 * The code and markdown views load on demand, like pdf.js and react-markdown: they bring
 * @mantine/code-highlight, which an app that only shows PDFs and images never needs
 */
export const CodeView = React.lazy(() =>
  importCodeView().then((module) => ({ default: module.CodeView }))
);

export const MarkdownView = React.lazy(() =>
  importMarkdownView().then((module) => ({ default: module.MarkdownView }))
);

/** A lazy view, with the toolbar and the loading message the views show while a file loads */
export function LazyView({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <>
          <DocViewerToolbar />
          <DocViewerBody focusable={false}>
            <DocViewerLoading />
          </DocViewerBody>
        </>
      }
    >
      {children}
    </Suspense>
  );
}
