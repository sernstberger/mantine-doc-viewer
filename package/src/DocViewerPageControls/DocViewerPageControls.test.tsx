import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerPageControls,
  DocViewerPageControlsProps,
  DocViewerPageControlsStylesNames,
} from './DocViewerPageControls';

const state = { type: 'pdf', page: 2, numPages: 5 } as const;
const { Harness } = createPartHarness(DocViewerPageControls, { state });

describe('mantine-doc-viewer/DocViewerPageControls', () => {
  tests.itSupportsSystemProps<DocViewerPageControlsProps, DocViewerPageControlsStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerPageControls',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['pageControls', 'pageIndicator', 'control'],
    selector: '.mantine-DocViewer-pageControls',
  });

  tests.itThrowsContextError({
    component: DocViewerPageControls,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('shows the page and goes to the previous and next page through the store', () => {
    const goToPage = jest.fn();
    const { Harness: Paging } = createPartHarness(DocViewerPageControls, {
      state,
      actions: { goToPage },
    });
    render(<Paging />);
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(goToPage).toHaveBeenLastCalledWith(3, undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(goToPage).toHaveBeenLastCalledWith(1, undefined);
  });

  it('disables the buttons at the first and last page', () => {
    const { Harness: First } = createPartHarness(DocViewerPageControls, {
      state: { ...state, page: 1 },
    });
    const { Harness: Last } = createPartHarness(DocViewerPageControls, {
      state: { ...state, page: 5 },
    });
    render(
      <>
        <First />
        <Last />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Previous page' })[0]).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getAllByRole('button', { name: 'Next page' })[1]).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('formats the numbers for the locale', () => {
    const { Harness: Arabic } = createPartHarness(DocViewerPageControls, {
      state,
      rootProps: { locale: 'ar-EG' },
    });
    render(<Arabic />);
    expect(screen.getByText('٢ / ٥')).toBeInTheDocument();
  });

  it('renders nothing for other documents', () => {
    const { Harness: Image } = createPartHarness(DocViewerPageControls, {
      src: '/files/photo.png',
      state: { type: 'image' },
    });
    render(<Image />);
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerPageControls, {
      ...{ state },
      viewerProps: { toolbarControls: { pages: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Next page' })).toHaveLength(1);
  });
});
