import React, { use, useEffect } from 'react';
import { getEnv } from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { ImageView } from '../DocViewerImage/ImageView';
import { OverlayControls } from '../DocViewerOverlayControls/OverlayControls';
import { TextView } from '../DocViewerText/TextView';
import { CodeView, LazyView, MarkdownView } from './lazy-views';
import { DocViewerLayoutContext } from './layout-context';
import { PdfView } from './PdfView';
import { UnsupportedView } from './UnsupportedView';

let warnedMissingPdfAdapter = false;

/** Forgets that the missing PDF adapter warning was shown, for tests */
export function resetMissingPdfAdapterWarning() {
  warnedMissingPdfAdapter = false;
}

function MissingPdfAdapter() {
  useEffect(() => {
    if (getEnv() === 'development' && !warnedMissingPdfAdapter) {
      warnedMissingPdfAdapter = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[mantine-doc-viewer] PDF files need DocViewerAdapterProvider with createPdfJsAdapter: <DocViewerAdapterProvider pdf={createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc })}>"
      );
    }
  }, []);
  return <UnsupportedView type="pdf" />;
}

function DocumentView() {
  const { type } = useDocViewerContext();
  const adapters = useDocViewerAdapters();

  switch (type) {
    case 'pdf':
      return adapters.pdf ? <PdfView /> : <MissingPdfAdapter />;
    case 'image':
      return <ImageView />;
    case 'text':
      return <TextView />;
    case 'code':
      return (
        <LazyView>
          <CodeView />
        </LazyView>
      );
    case 'markdown':
      return (
        <LazyView>
          {adapters.markdown ? <MarkdownView /> : <CodeView language="markdown" />}
        </LazyView>
      );
    default:
      return <UnsupportedView type={type} />;
  }
}

/** The layout `DocViewer` shows without children: the view for the document type and the overlay controls */
export function LegacyLayout() {
  const { type, src, keepView } = useDocViewerContext();
  const { withOverlayControls } = use(DocViewerLayoutContext);

  return (
    <>
      <React.Fragment key={keepView ? type : `${type}:${src}`}>
        <DocumentView />
      </React.Fragment>
      {withOverlayControls && <OverlayControls />}
    </>
  );
}
