import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef, useState } from 'react';
import type { DocViewerController, DocViewerZoom } from '../hooks/use-controller-registry';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import { normalizeZoom } from '../hooks/use-zoom-setting';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

function loadImage() {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: 800 });
  Object.defineProperty(image, 'naturalHeight', { value: 400 });
  fireEvent.load(image);
}

const zoomLevel = () => screen.getByRole('button', { name: /Reset zoom/ });

/** A viewer whose zoom the app holds, and changes with its own "Set zoom" button */
function ControlledViewer({
  src,
  initial,
  next,
  ...props
}: {
  src: string;
  initial: DocViewerZoom;
  next: DocViewerZoom;
  controllerRef?: React.Ref<DocViewerController>;
  onZoomChange: (zoom: DocViewerZoom, details: { scale: number }) => void;
}) {
  const [zoom, setZoom] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setZoom(next)}>
        Set zoom
      </button>
      <DocViewer src={src} pdfWorkerSrc="/worker.mjs" zoom={zoom} {...props} />
    </>
  );
}

describe('normalizeZoom', () => {
  it('keeps fit zooms and clamps scales to the zoom range', () => {
    expect(normalizeZoom('fit')).toBe('fit');
    expect(normalizeZoom('fit-page')).toBe('fit-page');
    expect(normalizeZoom(40)).toBe(8);
    expect(normalizeZoom(0.01)).toBe(0.1);
  });
});

describe('controlled zoom', () => {
  beforeEach(() => getDocument.mockReset());

  it('shows the zoom of an image from the zoom prop, and reports requests without applying them', async () => {
    const controller = createRef<DocViewerController>();
    const onZoomChange = jest.fn();
    render(
      <ControlledViewer
        src="/files/photo.png"
        initial={1.5}
        next={2}
        controllerRef={controller}
        onZoomChange={onZoomChange}
      />
    );
    // Not reported before the image is shown
    act(() => controller.current!.setZoom(3));
    expect(onZoomChange).not.toHaveBeenCalled();

    loadImage();
    expect(zoomLevel()).toHaveTextContent('150%');
    expect(onZoomChange).toHaveBeenLastCalledWith(1.5, { scale: 1.5 });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    // The app has not passed it back yet
    expect(zoomLevel()).toHaveTextContent('150%');

    const calls = onZoomChange.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Set zoom' }));
    expect(zoomLevel()).toHaveTextContent('200%');
    // The zoom it reported is not reported again when it comes back
    expect(onZoomChange).toHaveBeenCalledTimes(calls);
  });

  it('follows the app through a round trip, for a PDF', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    const onZoomChange = jest.fn();

    function App() {
      const [zoom, setZoom] = useState<DocViewerZoom>(2);
      return (
        <DocViewer
          src="/files/report.pdf"
          pdfWorkerSrc="/worker.mjs"
          zoom={zoom}
          controllerRef={controller}
          onZoomChange={(next, details) => {
            onZoomChange(next, details);
            setZoom(next);
          }}
        />
      );
    }

    render(<App />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(zoomLevel()).toHaveTextContent('200%');
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });

    act(() => controller.current!.setZoom('fit'));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit', { scale: expect.any(Number) });
    expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(expect.any(Number), {
      scale: expect.any(Number),
    });
    const [zoom, { scale }] = onZoomChange.mock.calls.at(-1)!;
    expect(zoom).toBe(scale);
    expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('reports a request again when the app refused it', async () => {
    const controller = createRef<DocViewerController>();
    const onZoomChange = jest.fn();
    render(
      <ControlledViewer
        src="/files/photo.png"
        initial={1.5}
        next={2}
        controllerRef={controller}
        onZoomChange={onZoomChange}
      />
    );
    loadImage();
    onZoomChange.mockClear();

    act(() => controller.current!.setZoom(2));
    act(() => controller.current!.setZoom(2));
    expect(onZoomChange).toHaveBeenCalledTimes(2);
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    expect(zoomLevel()).toHaveTextContent('150%');
  });

  it('reports a zoom the app sets', async () => {
    mockPdf();
    const onZoomChange = jest.fn();
    render(
      <ControlledViewer
        src="/files/report.pdf"
        initial={1}
        next="fit-page"
        onZoomChange={onZoomChange}
      />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(onZoomChange).toHaveBeenLastCalledWith(1, { scale: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'Set zoom' }));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: expect.any(Number) });
  });
});
