import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import { DocViewer } from '../DocViewer';
import {
  DocViewerOverlayControls,
  DocViewerOverlayControlsProps,
  DocViewerOverlayControlsStylesNames,
} from './DocViewerOverlayControls';

function setFullscreenSupport(value: boolean | undefined) {
  Object.defineProperty(document, 'fullscreenEnabled', { value, configurable: true });
}

const image = { src: '/files/photo.png', state: { type: 'image' } } as const;
const { Harness } = createPartHarness(DocViewerOverlayControls, image);

describe('mantine-doc-viewer/DocViewerOverlayControls', () => {
  beforeEach(() => setFullscreenSupport(true));
  afterEach(() => setFullscreenSupport(undefined));

  tests.itSupportsSystemProps<DocViewerOverlayControlsProps, DocViewerOverlayControlsStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerOverlayControls',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['overlayControls', 'overlayControl'],
    selector: '.mantine-DocViewer-overlayControls',
  });

  tests.itThrowsContextError({
    component: DocViewerOverlayControls,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('zooms through the store and toggles full screen', async () => {
    const zoomIn = jest.fn();
    const zoomOut = jest.fn();
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;
    const { Harness: Floating } = createPartHarness(DocViewerOverlayControls, {
      ...image,
      actions: { zoomIn, zoomOut },
    });
    render(<Floating />);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(zoomIn).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(zoomOut).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('zooms a loaded image', async () => {
    const onZoomChange = jest.fn();
    render(
      <DocViewer
        src="/files/photo.png"
        withToolbar={false}
        withOverlayControls
        defaultZoom={1}
        onZoomChange={onZoomChange}
      />
    );
    const photo = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(photo, 'naturalWidth', { value: 800 });
    Object.defineProperty(photo, 'naturalHeight', { value: 400 });
    fireEvent.load(photo);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1.25, { scale: 1.25 });
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1, { scale: 1 });
  });

  it('names the full screen button after what it does while the viewer is full screen', async () => {
    const { Harness: Full } = createPartHarness(DocViewerOverlayControls, {
      ...image,
      state: { ...image.state, fullscreen: true },
    });
    render(<Full />);
    expect(await screen.findByRole('button', { name: 'Exit full screen' })).not.toHaveAttribute(
      'aria-pressed'
    );
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('leaves out zoom until the document is shown, and full screen without browser support', () => {
    setFullscreenSupport(false);
    const { Harness: Loading } = createPartHarness(DocViewerOverlayControls, {
      ...image,
      state: { type: 'image', status: 'loading' },
    });
    render(
      <>
        <Harness />
        <Loading />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Zoom in' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('hides the controls it is told to', () => {
    render(<Harness controls={{ zoom: false }} />);
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerOverlayControls, {
      ...image,
      viewerProps: { toolbarControls: { zoom: false, fullscreen: false } },
    });
    render(<Hidden />);
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('passes tooltipProps to the tooltip of every control', async () => {
    render(<Harness tooltipProps={{ disabled: true }} />);
    fireEvent.focus(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('adds nothing to DocViewer by default, and floats over a viewer without a toolbar', () => {
    render(
      <>
        <DocViewer src="/files/photo.png" withToolbar={false} />
        <DocViewer src="/files/photo.png" withToolbar={false} withOverlayControls />
      </>
    );
    expect(document.querySelectorAll('.mantine-DocViewer-overlayControls')).toHaveLength(1);
  });
});
