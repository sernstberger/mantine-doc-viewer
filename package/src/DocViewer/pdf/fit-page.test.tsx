import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';
import { toPdfZoom } from './zoom';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

describe('toPdfZoom', () => {
  it('fits the width for fit, keeps fit-page and clamps scales', () => {
    expect(toPdfZoom('fit')).toBe('fit-width');
    expect(toPdfZoom('fit-page')).toBe('fit-page');
    expect(toPdfZoom(1.5)).toBe(1.5);
    expect(toPdfZoom(40)).toBe(8);
  });
});

describe('fit-page zoom', () => {
  beforeEach(() => getDocument.mockReset());

  it('opens a PDF fitted to the page and reports a fitted zoom', async () => {
    mockPdf();
    const onZoomChange = jest.fn();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom="fit-page"
        defaultPageLayout="two-page"
        onZoomChange={onZoomChange}
      />
    );

    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: 1 });
    // The toolbar button fits the width, which is a different fit
    expect(screen.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('fits the page through the controller, and back to a scale', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    const onZoomChange = jest.fn();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultZoom={2}
        controllerRef={controller}
        onZoomChange={onZoomChange}
      />
    );

    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    act(() => controller.current!.setZoom('fit-page'));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: 1 });
  });

  it('fits a whole image for fit-page', async () => {
    const controller = createRef<DocViewerController>();
    const onZoomChange = jest.fn();
    render(
      <DocViewer
        src="/files/photo.png"
        defaultZoom="fit-page"
        controllerRef={controller}
        onZoomChange={onZoomChange}
      />
    );
    const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 600 });
    fireEvent.load(image);

    await waitFor(() =>
      expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: expect.any(Number) })
    );
    act(() => controller.current!.setZoom(2));
    expect(onZoomChange).toHaveBeenLastCalledWith(2, { scale: 2 });
    act(() => controller.current!.setZoom('fit-page'));
    expect(onZoomChange).toHaveBeenLastCalledWith('fit-page', { scale: expect.any(Number) });
  });
});
