// The parts of the Storybook preview that belong to this repo only
import './fonts';
import { CodeHighlightAdapterProvider, createShikiAdapter } from '@mantine/code-highlight';
import { createTheme } from '@mantine/core';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewerAdapterProvider,
} from '../package/src';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React from 'react';

const shikiAdapter = createShikiAdapter(async () => {
  const { createHighlighter } = await import('shiki');
  return createHighlighter({
    langs: ['tsx', 'ts', 'json', 'markdown', 'python', 'bash'],
    themes: [],
  });
});

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });
const markdownAdapter = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

/** This repo's Mantine theme for the shared preview */
export const repoTheme = createTheme({});

/** Gives every story the code highlighter and the pdf.js and markdown engines */
export const repoDecorators = [
  (renderStory: () => React.ReactNode) => (
    <CodeHighlightAdapterProvider adapter={shikiAdapter}>
      <DocViewerAdapterProvider pdf={pdfAdapter} markdown={markdownAdapter}>
        {renderStory()}
      </DocViewerAdapterProvider>
    </CodeHighlightAdapterProvider>
  ),
];
