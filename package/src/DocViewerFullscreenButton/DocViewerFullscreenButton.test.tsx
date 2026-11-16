import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerFullscreenButton,
  DocViewerFullscreenButtonProps,
  DocViewerFullscreenButtonStylesNames,
} from './DocViewerFullscreenButton';

const { Harness } = createPartHarness(DocViewerFullscreenButton);

function setFullscreenSupport(value: boolean | undefined) {
  Object.defineProperty(document, 'fullscreenEnabled', { value, configurable: true });
}

describe('mantine-doc-viewer/DocViewerFullscreenButton', () => {
  beforeEach(() => setFullscreenSupport(true));
  afterEach(() => setFullscreenSupport(undefined));

  tests.itSupportsSystemProps<DocViewerFullscreenButtonProps, DocViewerFullscreenButtonStylesNames>(
    {
      component: Harness,
      props: {},
      displayName: 'mantine-doc-viewer/DocViewerFullscreenButton',
      refType: HTMLButtonElement,
      ...PART_TEST_OPTIONS,
      stylesApiSelectors: ['control'],
      selector: '.mantine-DocViewer-control',
    }
  );

  tests.itThrowsContextError({
    component: DocViewerFullscreenButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('toggles full screen through the store', () => {
    render(<Harness />);
    const button = screen.getByRole('button', { name: 'Full screen' });
    expect(button).not.toHaveAttribute('aria-pressed');
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;
    fireEvent.click(button);
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('is named after what it does while in full screen', () => {
    const { Harness: Full } = createPartHarness(DocViewerFullscreenButton, {
      state: { fullscreen: true },
    });
    render(<Full />);
    expect(screen.getByRole('button', { name: 'Exit full screen' })).not.toHaveAttribute(
      'aria-pressed'
    );
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('renders nothing where the browser has no full screen', () => {
    setFullscreenSupport(false);
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerFullscreenButton, {
      ...{},
      viewerProps: { toolbarControls: { fullscreen: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Full screen' })).toHaveLength(1);
  });
});
