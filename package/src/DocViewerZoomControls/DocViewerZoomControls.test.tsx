import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerZoomControls,
  DocViewerZoomControlsProps,
  DocViewerZoomControlsStylesNames,
} from './DocViewerZoomControls';

const state = { type: 'pdf', scale: 1.5, zoom: 1.5 } as const;
const { Harness } = createPartHarness(DocViewerZoomControls, { state });

function setup(options: Parameters<typeof createPartHarness>[1] = {}) {
  const setZoom = jest.fn();
  const { Harness: Zoom } = createPartHarness(DocViewerZoomControls, {
    state,
    ...options,
    actions: { setZoom },
  });
  return { Zoom, setZoom };
}

describe('mantine-doc-viewer/DocViewerZoomControls', () => {
  tests.itSupportsSystemProps<DocViewerZoomControlsProps, DocViewerZoomControlsStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerZoomControls',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['zoomControls', 'zoomLevel', 'control'],
    selector: '.mantine-DocViewer-zoomControls',
  });

  tests.itThrowsContextError({
    component: DocViewerZoomControls,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('zooms in, out and back to 100% through the store, without the menu', () => {
    const { Zoom, setZoom } = setup();
    render(<Zoom withMenu={false} />);
    expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent('150%');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(setZoom).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(setZoom).toHaveBeenLastCalledWith(1.25);
    fireEvent.click(screen.getByRole('button', { name: /Reset zoom/ }));
    expect(setZoom).toHaveBeenLastCalledWith(1);
  });

  it('fits the PDF to the width, or to the view for layouts that fit the height', () => {
    const { Zoom, setZoom } = setup({ state: { ...state, zoom: 'fit' } });
    const { Zoom: Horizontal } = setup({ state: { ...state, pageLayout: 'horizontal' } });
    render(
      <>
        <Zoom />
        <Horizontal />
      </>
    );
    const fit = screen.getByRole('button', { name: 'Fit to width' });
    expect(fit).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(fit);
    expect(setZoom).toHaveBeenLastCalledWith('fit');
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('serves an image, which fits to the view', () => {
    const { Zoom } = setup({ src: '/files/photo.png', state: { type: 'image', zoom: 'fit' } });
    render(<Zoom />);
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('opens a menu of zoom presets with withMenu', async () => {
    const { Zoom, setZoom } = setup({ state: { ...state, zoom: 'fit' } });
    render(<Zoom withMenu classNames={{ dropdown: 'app-dropdown' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom 150%' }));
    expect(document.querySelector('.app-dropdown')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: '75%' }));
    expect(setZoom).toHaveBeenLastCalledWith(0.75);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom 150%' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fit to width' }));
    expect(setZoom).toHaveBeenLastCalledWith('fit');
  });

  it('marks the fit item of the menu while the zoom fits', async () => {
    const { Zoom: Fitted } = setup({ state: { ...state, zoom: 'fit' } });
    const { Zoom: Scaled } = setup();
    const { unmount } = render(<Fitted withMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom 150%' }));
    expect(screen.getByRole('menuitem', { name: 'Fit to width' })).toHaveAttribute('data-active');
    unmount();

    render(<Scaled withMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom 150%' }));
    expect(screen.getByRole('menuitem', { name: 'Fit to width' })).not.toHaveAttribute(
      'data-active'
    );
  });

  it('renders nothing for other documents', () => {
    const { Zoom } = setup({ src: '/files/notes.txt', state: { type: 'text' } });
    render(
      <>
        <Zoom />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerZoomControls, {
      ...{ state },
      viewerProps: { toolbarControls: { zoom: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Zoom in' })).toHaveLength(1);
  });
});
