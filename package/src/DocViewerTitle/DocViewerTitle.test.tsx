import { render, screen, tests } from '@mantine-tests/core';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import { DocViewerTitle, DocViewerTitleProps, DocViewerTitleStylesNames } from './DocViewerTitle';

const { Harness } = createPartHarness(DocViewerTitle);
const { Harness: Subtitled } = createPartHarness(DocViewerTitle);

describe('mantine-doc-viewer/DocViewerTitle', () => {
  tests.itSupportsSystemProps<DocViewerTitleProps, DocViewerTitleStylesNames>({
    component: Subtitled,
    props: { subtitle: 'Draft 4' },
    displayName: 'mantine-doc-viewer/DocViewerTitle',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['heading', 'title', 'subtitle'],
    selector: '.mantine-DocViewer-heading',
  });

  tests.itThrowsContextError({
    component: DocViewerTitle,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('shows the file name, or the document label without one', () => {
    const { Harness: Blob } = createPartHarness(DocViewerTitle, { src: 'blob:abc' });
    render(
      <>
        <Harness />
        <Blob />
      </>
    );
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('shows a title and a subtitle of its own', () => {
    render(<Harness title="Contract" subtitle="Draft 4" />);
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Draft 4')).toBeInTheDocument();
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerTitle, {
      viewerProps: { toolbarControls: { title: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByText('report.pdf')).toHaveLength(1);
  });

  it('shows the title and subtitle the toolbar of DocViewer is given', () => {
    const { Harness: Toolbar } = createPartHarness(DocViewerTitle, {
      viewerProps: { toolbarProps: { title: 'Sheet', subtitle: 'Edited' } },
    });
    render(<Toolbar />);
    expect(screen.getAllByText('Sheet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Edited').length).toBeGreaterThan(0);
  });
});
