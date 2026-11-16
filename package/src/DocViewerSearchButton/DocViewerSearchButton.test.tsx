import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerSearchButton,
  DocViewerSearchButtonProps,
  DocViewerSearchButtonStylesNames,
} from './DocViewerSearchButton';

const { Harness } = createPartHarness(DocViewerSearchButton, {
  state: { type: 'pdf', searchAvailable: true },
});

describe('mantine-doc-viewer/DocViewerSearchButton', () => {
  tests.itSupportsSystemProps<DocViewerSearchButtonProps, DocViewerSearchButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerSearchButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerSearchButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('opens and closes search through the store', () => {
    const openSearch = jest.fn();
    const closeSearch = jest.fn();
    const { Harness: Closed } = createPartHarness(DocViewerSearchButton, {
      state: { type: 'pdf', searchAvailable: true },
      actions: { openSearch },
    });
    const { Harness: Opened } = createPartHarness(DocViewerSearchButton, {
      state: { type: 'pdf', searchOpened: true, searchAvailable: true },
      actions: { closeSearch },
    });
    render(
      <>
        <Closed />
        <Opened />
      </>
    );
    const [closed, opened] = screen.getAllByRole('button', { name: 'Search' });
    expect(closed).toHaveAttribute('aria-pressed', 'false');
    expect(opened).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(closed);
    expect(openSearch).toHaveBeenCalledWith(undefined);
    fireEvent.click(opened);
    expect(closeSearch).toHaveBeenCalled();
  });

  it('renders nothing for other documents', () => {
    const { Harness: Image } = createPartHarness(DocViewerSearchButton, {
      src: '/files/photo.png',
      state: { type: 'image' },
    });
    render(
      <>
        <Image />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('is hidden while no search bar is mounted', () => {
    const { Harness: NoSearch } = createPartHarness(DocViewerSearchButton, {
      state: { type: 'pdf' },
    });
    render(<NoSearch />);
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerSearchButton, {
      ...{ state: { type: 'pdf', searchAvailable: true } },
      viewerProps: { toolbarControls: { search: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Search' })).toHaveLength(1);
  });
});
