import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerRotateButton,
  DocViewerRotateButtonProps,
  DocViewerRotateButtonStylesNames,
} from './DocViewerRotateButton';

const rotate = jest.fn();
const { Harness } = createPartHarness(DocViewerRotateButton, {
  state: { type: 'pdf' },
  actions: { rotate },
});

describe('mantine-doc-viewer/DocViewerRotateButton', () => {
  tests.itSupportsSystemProps<DocViewerRotateButtonProps, DocViewerRotateButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerRotateButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerRotateButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('rotates through the store, for a PDF and for an image', () => {
    const { Harness: Image } = createPartHarness(DocViewerRotateButton, {
      src: '/files/photo.png',
      state: { type: 'image' },
      actions: { rotate },
    });
    render(
      <>
        <Harness />
        <Image />
      </>
    );
    screen.getAllByRole('button', { name: 'Rotate' }).forEach((button) => fireEvent.click(button));
    expect(rotate).toHaveBeenCalledTimes(2);
  });

  it('renders nothing for other documents and before the document is shown', () => {
    const { Harness: Text } = createPartHarness(DocViewerRotateButton, {
      src: '/files/notes.txt',
      state: { type: 'text' },
    });
    const { Harness: Loading } = createPartHarness(DocViewerRotateButton, {
      state: { type: 'pdf', status: 'loading' },
    });
    render(
      <>
        <Text />
        <Loading />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerRotateButton, {
      ...{ state: { type: 'pdf' } },
      viewerProps: { toolbarControls: { rotate: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Rotate' })).toHaveLength(1);
  });
});
