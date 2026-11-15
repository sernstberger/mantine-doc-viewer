import {
  createPdfJsAdapter,
  type DocViewerPdfJsOptions,
} from '../package/src/DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { createReactMarkdownAdapter } from '../package/src/DocViewerAdapterProvider/adapters/react-markdown-adapter';

/** pdf.js for the legacy helper in stories; Jest maps this module to legacy-engines.mock.ts */
export function createLegacyPdfAdapter(
  workerSrc: string | undefined,
  options: (src: string) => DocViewerPdfJsOptions | undefined
) {
  return createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc, options });
}

export const legacyMarkdownAdapter = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);
