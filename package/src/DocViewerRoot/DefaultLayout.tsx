import React, { use } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerControl } from '../doc-viewer.types';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { ImageView } from '../DocViewerImage/ImageView';
import { DocViewerInfoButton } from '../DocViewerInfoButton/DocViewerInfoButton';
import { DocViewerLayoutMenu } from '../DocViewerLayoutMenu/DocViewerLayoutMenu';
import { DocViewerMain } from '../DocViewerMain/DocViewerMain';
import { DocViewerOutlineButton } from '../DocViewerOutlineButton/DocViewerOutlineButton';
import { OverlayControls } from '../DocViewerOverlayControls/OverlayControls';
import { DocViewerPageControls } from '../DocViewerPageControls/DocViewerPageControls';
import { DocViewerPresentationButton } from '../DocViewerPresentationButton/DocViewerPresentationButton';
import { DocViewerRotateButton } from '../DocViewerRotateButton/DocViewerRotateButton';
import { DocViewerSearch } from '../DocViewerSearch/DocViewerSearch';
import { DocViewerSearchButton } from '../DocViewerSearchButton/DocViewerSearchButton';
import { TextView } from '../DocViewerText/TextView';
import { DocViewerThumbnailsButton } from '../DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import { ToolbarView } from '../DocViewerToolbar/ToolbarView';
import { DocViewerZoomControls } from '../DocViewerZoomControls/DocViewerZoomControls';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { useDocViewerExtensions } from './extensions-context';
import { DocViewerLayoutContext } from './layout-context';
import { CodeView, LazyView, MarkdownView } from './lazy-views';
import { useReadyPdfSession } from './pdf-session-context';
import { UnsupportedView } from './UnsupportedView';

const PDF_CONTROLS: [DocViewerControl, React.ComponentType][] = [
  ['thumbnails', DocViewerThumbnailsButton],
  ['pages', DocViewerPageControls],
  ['zoom', DocViewerZoomControls],
  ['rotate', DocViewerRotateButton],
  ['layout', DocViewerLayoutMenu],
  ['outline', DocViewerOutlineButton],
  ['info', DocViewerInfoButton],
  ['presentation', DocViewerPresentationButton],
  ['search', DocViewerSearchButton],
];

/** The PDF toolbar controls, with the extensions' controls after their anchor controls */
function DefaultPdfControls() {
  const extensions = useDocViewerExtensions();
  const extra = extensions.flatMap((extension) => extension.toolbarControls ?? []);

  return PDF_CONTROLS.flatMap(([control, Control]) => [
    <Control key={control} />,
    ...extra
      .filter((item) => item.after === control)
      .map((item) => <item.Component key={item.control} />),
  ]);
}

/** The PDF toolbar: the PDF's controls and print once it is loaded, while reading */
function DefaultPdfToolbar({ reading }: { reading: boolean }) {
  const session = useReadyPdfSession();
  const withControls = !!session && reading;

  return (
    <ToolbarView onPrint={withControls ? session.actions.print : undefined}>
      {withControls && <DefaultPdfControls />}
    </ToolbarView>
  );
}

/** Toolbar, search, the extensions' bars, and the pages with their thumbnails */
function DefaultPdfLayout() {
  const { store } = useDocViewerContext();
  const extensions = useDocViewerExtensions();
  const presenting = useDocViewerState(store, (state) => state.presenting);
  const reading = useDocViewerState(store, (state) => state.mode === 'read');
  const withBars = !presenting && reading;

  return (
    <>
      {!presenting && <DefaultPdfToolbar reading={reading} />}
      {withBars &&
        extensions.map((extension) => extension.bar && <extension.bar key={extension.name} />)}
      {withBars && <DocViewerSearch />}
      <DocViewerMain />
    </>
  );
}

function DocumentView() {
  const { type } = useDocViewerContext();
  const adapters = useDocViewerAdapters();

  switch (type) {
    case 'pdf':
      return adapters.pdf ? <DefaultPdfLayout /> : <UnsupportedView type="pdf" />;
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

/** What `DocViewer` shows without children: the default layout for the document type */
export function DefaultLayout() {
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
