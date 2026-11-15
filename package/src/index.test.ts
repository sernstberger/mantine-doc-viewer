import { DocViewer } from './DocViewer';
import { DEFAULT_LABELS } from './default-labels';
import { DocViewerBody, useDocViewerContext } from './DocViewerBody/DocViewerBody';
import { DocViewerLoading } from './DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from './DocViewerMessage/DocViewerMessage';
import { DocViewerToolbar } from './DocViewerToolbar/DocViewerToolbar';
import * as api from './index';
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
});
