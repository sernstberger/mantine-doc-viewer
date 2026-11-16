import { render, screen, tests } from '@mantine-tests/core';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerDownloadButton,
  DocViewerDownloadButtonProps,
  DocViewerDownloadButtonStylesNames,
} from './DocViewerDownloadButton';

const { Harness } = createPartHarness(DocViewerDownloadButton);

describe('mantine-doc-viewer/DocViewerDownloadButton', () => {
  tests.itSupportsSystemProps<DocViewerDownloadButtonProps, DocViewerDownloadButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerDownloadButton',
    refType: HTMLAnchorElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerDownloadButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('links to the document and names the download after the file', () => {
    render(<Harness />);
    const link = screen.getByRole('link', { name: 'Download' });
    expect(link).toHaveAttribute('href', '/files/report.pdf');
    expect(link).toHaveAttribute('download', 'report.pdf');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('downloads without a file name for a blob url', () => {
    const { Harness: Blob } = createPartHarness(DocViewerDownloadButton, { src: 'blob:abc' });
    render(<Blob />);
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download', '');
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerDownloadButton, {
      ...{},
      viewerProps: { toolbarControls: { download: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('link', { name: 'Download' })).toHaveLength(1);
  });
});
