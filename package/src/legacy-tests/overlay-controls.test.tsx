import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';

function loadImage() {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: 800 });
  Object.defineProperty(image, 'naturalHeight', { value: 400 });
  fireEvent.load(image);
}

describe('withOverlayControls', () => {
  afterEach(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: undefined, configurable: true });
  });

  it('adds nothing by default', () => {
    render(<DocViewer src="/files/photo.png" withToolbar={false} />);
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  it('floats zoom and full screen buttons over a viewer without a toolbar', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;

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
    loadImage();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1.25, { scale: 1.25 });
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1, { scale: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();

    // The button shows the exit label while in full screen
    const root = document.querySelector('[data-doc-type]')!;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: root });
    fireEvent(root, new Event('fullscreenchange'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Full screen' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
    delete (document as any).fullscreenElement;
  });

  it('leaves out full screen without withFullscreen or browser support', () => {
    const { rerender } = render(
      <DocViewer src="/files/photo.png" withToolbar={false} withOverlayControls />
    );
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();

    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    rerender(
      <DocViewer
        key="supported"
        src="/files/photo.png"
        withToolbar={false}
        withOverlayControls
        withFullscreen={false}
      />
    );
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });
});
