import { DocsTabs } from '../components/DocsTabs';
import { PageHeader } from '../components/PageHeader';
import { Shell } from '../components/Shell';
import { PACKAGE_DATA } from '../data';
import docgen from '../docgen.json';
import Docs from '../docs.mdx';
import { STYLES_API_DATA } from '../styles-api';

/** Props tables of the component, then of every part, in the order of the `DocViewer` statics */
const PROPS_COMPONENTS = [
  'DocViewer',
  'DocViewerRoot',
  'DocViewerToolbar',
  'DocViewerTitle',
  'DocViewerPageControls',
  'DocViewerZoomControls',
  'DocViewerThumbnailsButton',
  'DocViewerRotateButton',
  'DocViewerLayoutMenu',
  'DocViewerOutlineButton',
  'DocViewerInfoButton',
  'DocViewerPresentationButton',
  'DocViewerSearchButton',
  'DocViewerPrintButton',
  'DocViewerDownloadButton',
  'DocViewerFullscreenButton',
  'DocViewerWrapButton',
  'DocViewerViewModeControl',
  'DocViewerMain',
  'DocViewerBody',
  'DocViewerPages',
  'DocViewerThumbnails',
  'DocViewerSearch',
  'DocViewerOutline',
  'DocViewerDocumentInfo',
  'DocViewerPresentationControls',
  'DocViewerOverlayControls',
  'DocViewerImage',
  'DocViewerText',
  'DocViewerCode',
  'DocViewerMarkdown',
  'DocViewerMessage',
  'DocViewerLoading',
  'DocViewerPageEditor',
  'DocViewerPageEditorButton',
  'DocViewerMarkupBar',
  'DocViewerMarkupButton',
];

export default function HomePage() {
  return (
    <Shell>
      <PageHeader data={PACKAGE_DATA} />
      <DocsTabs
        docgen={docgen}
        componentPrefix="DocViewer"
        componentsProps={PROPS_COMPONENTS}
        componentsStyles={['DocViewer']}
        stylesApiData={STYLES_API_DATA}
      >
        <Docs />
      </DocsTabs>
    </Shell>
  );
}
