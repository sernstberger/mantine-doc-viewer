import * as pdfjs from 'pdfjs-dist';
import { DocViewer } from '../DocViewer';
import { createPdfJsAdapter } from '../DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { DocViewerAdapterProvider } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerProps } from '../DocViewerBase';
import { createMarkupExtension, type DocViewerMarkupOptions } from './markup-extension';

const pdfAdapter = createPdfJsAdapter(() => Promise.resolve(pdfjs), { workerSrc: '/worker.mjs' });

export interface MarkupViewerProps extends Partial<DocViewerProps> {
  /** Options of the markup extension */
  markup?: DocViewerMarkupOptions;
}

/**
 * The simple viewer at 100% with the markup extension, for tests, like Lightbox's LightboxWrapper.
 * Jest maps `pdfjs-dist` to its test double, a three page PDF
 */
export function MarkupViewer({ markup, ...props }: MarkupViewerProps) {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter}>
      <DocViewer
        src="/files/report.pdf"
        defaultZoom={1}
        extensions={[createMarkupExtension(markup)]}
        {...props}
      />
    </DocViewerAdapterProvider>
  );
}
