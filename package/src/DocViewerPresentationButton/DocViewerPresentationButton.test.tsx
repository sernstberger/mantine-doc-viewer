import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerPresentationButton,
  DocViewerPresentationButtonProps,
  DocViewerPresentationButtonStylesNames,
} from './DocViewerPresentationButton';

const { Harness } = createPartHarness(DocViewerPresentationButton, { state: { type: 'pdf' } });

describe('mantine-doc-viewer/DocViewerPresentationButton', () => {
  tests.itSupportsSystemProps<
    DocViewerPresentationButtonProps,
    DocViewerPresentationButtonStylesNames
  >({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerPresentationButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerPresentationButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('starts a presentation through the store', () => {
    const togglePresentation = jest.fn();
    const { Harness: Present } = createPartHarness(DocViewerPresentationButton, {
      state: { type: 'pdf' },
      actions: { togglePresentation },
    });
    render(<Present />);
    fireEvent.click(screen.getByRole('button', { name: 'Presentation' }));
    expect(togglePresentation).toHaveBeenCalled();
  });

  it('renders nothing for other documents', () => {
    const { Harness: Image } = createPartHarness(DocViewerPresentationButton, {
      src: '/files/photo.png',
      state: { type: 'image' },
    });
    render(
      <>
        <Image />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Presentation' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerPresentationButton, {
      ...{ state: { type: 'pdf' } },
      viewerProps: { toolbarControls: { presentation: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Presentation' })).toHaveLength(1);
  });
});
