import { Fragment, use } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DocViewerCode } from '../DocViewerCode/DocViewerCode';
import { DocViewerImage } from '../DocViewerImage/DocViewerImage';
import { DocViewerMain } from '../DocViewerMain/DocViewerMain';
import { DocViewerMarkdown } from '../DocViewerMarkdown/DocViewerMarkdown';
import { DocViewerOverlayControls } from '../DocViewerOverlayControls/DocViewerOverlayControls';
import { DocViewerSearch } from '../DocViewerSearch/DocViewerSearch';
import { DocViewerText } from '../DocViewerText/DocViewerText';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { useDocViewerExtensions } from './extensions-context';
import { DocViewerLayoutContext } from './layout-context';
import { UnsupportedView } from './UnsupportedView';

/** Search, the extensions' bars, and the pages with their thumbnails */
function DefaultPdfLayout() {
  const { store } = useDocViewerContext();
  const extensions = useDocViewerExtensions();
  const presenting = useDocViewerState(store, (state) => state.presenting);
  const reading = useDocViewerState(store, (state) => state.mode === 'read');
  const withBars = !presenting && reading;

  return (
    <>
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
      return <DocViewerImage />;
    case 'text':
      return <DocViewerText />;
    case 'code':
      return <DocViewerCode />;
    case 'markdown':
      return <DocViewerMarkdown />;
    default:
      return <UnsupportedView type={type} />;
  }
}

/** What `DocViewer` shows without children: the toolbar and the default layout for the document type */
export function DefaultLayout() {
  const { type, src, keepView } = useDocViewerContext();
  const { withToolbar, toolbarProps, toolbarControls, withOverlayControls } =
    use(DocViewerLayoutContext);

  return (
    <>
      {withToolbar !== false && <DocViewerToolbar {...toolbarProps} controls={toolbarControls} />}
      <Fragment key={keepView ? type : `${type}:${src}`}>
        <DocumentView />
      </Fragment>
      {withOverlayControls && <DocViewerOverlayControls controls={toolbarControls} />}
    </>
  );
}
