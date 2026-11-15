import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerWrapButton,
  DocViewerWrapButtonProps,
  DocViewerWrapButtonStylesNames,
} from './DocViewerWrapButton';

const { Harness } = createPartHarness(DocViewerWrapButton, {
  src: '/files/notes.txt',
  state: { type: 'text' },
});

describe('mantine-doc-viewer/DocViewerWrapButton', () => {
  tests.itSupportsSystemProps<DocViewerWrapButtonProps, DocViewerWrapButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerWrapButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerWrapButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('toggles the wrapping of lines in the store', () => {
    const { Harness: Wrapping, store } = createPartHarness(DocViewerWrapButton, {
      src: '/files/notes.txt',
      state: { type: 'text' },
    });
    render(<Wrapping />);
    const button = screen.getByRole('button', { name: 'Wrap lines' });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);
    expect(store.getState().textWrap).toBe(false);
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(store.getState().textWrap).toBe(true);
  });

  it('renders nothing for other documents', () => {
    const { Harness: Pdf } = createPartHarness(DocViewerWrapButton, { state: { type: 'pdf' } });
    render(<Pdf />);
    expect(screen.queryByRole('button', { name: 'Wrap lines' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerWrapButton, {
      ...{ src: '/files/notes.txt', state: { type: 'text' } },
      viewerProps: { toolbarControls: { wrap: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Wrap lines' })).toHaveLength(1);
  });
});
