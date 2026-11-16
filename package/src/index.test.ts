import { DocViewer } from './DocViewer';
import { DEFAULT_LABELS } from './default-labels';
import { DocViewerBody } from './DocViewerBody/DocViewerBody';
import { useDocViewerContext } from './hooks/view/use-doc-viewer-context';
import { DocViewerLoading } from './DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from './DocViewerMessage/DocViewerMessage';
import { DocViewerToolbar } from './DocViewerToolbar/DocViewerToolbar';
import * as api from './index';
import type { DocViewerControlProps, DocViewerLinkControlProps } from './index';
import type { DocViewerMarkupLabelsInput } from './markup';
import { getDocViewerType } from './utils/get-doc-viewer-type';

describe('index', () => {
  it('exports the public api', () => {
    expect(api.DocViewer).toBe(DocViewer);
    expect(api.getDocViewerType).toBe(getDocViewerType);
    expect(api.DEFAULT_LABELS).toBe(DEFAULT_LABELS);
    expect(api.DocViewerToolbar).toBe(DocViewerToolbar);
    expect(api.DocViewerLoading).toBe(DocViewerLoading);
    expect(api.DocViewerMessage).toBe(DocViewerMessage);
    expect(api.DocViewerBody).toBe(DocViewerBody);
    expect(api.useDocViewerContext).toBe(useDocViewerContext);
    expect(api.useDocViewerText).toBeDefined();
  });

  it('exports the types that public props are built from', () => {
    const control: DocViewerControlProps = { color: 'red', onClick: () => {} };
    const link: DocViewerLinkControlProps = { href: '/files/report.pdf' };
    const labels: DocViewerMarkupLabelsInput = { markupToolLabels: { pen: 'Stift' } };
    expect([control, link, labels]).toHaveLength(3);
  });
});
