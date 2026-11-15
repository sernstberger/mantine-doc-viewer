// The parts of the Storybook preview that belong to this repo only
import './fonts';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewerAdapterProvider,
} from '../package/src';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React from 'react';

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });
const markdownAdapter = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

/** Gives every story the pdf.js and markdown engines, so the stories do not wrap themselves */
export const repoDecorators = [
  (renderStory: () => React.ReactNode) => (
    <DocViewerAdapterProvider pdf={pdfAdapter} markdown={markdownAdapter}>
      {renderStory()}
    </DocViewerAdapterProvider>
  ),
];
