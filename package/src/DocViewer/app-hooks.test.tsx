import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React, { createRef } from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import type { DocViewerController } from './controller';
import { DocViewer } from './DocViewer';

describe('onDocumentLoadStart', () => {
  it('is called on mount and again when src changes', () => {
    const onDocumentLoadStart = jest.fn();
    const { rerender } = render(
      <DocViewer src="/files/a.png" onDocumentLoadStart={onDocumentLoadStart} />
    );
    expect(onDocumentLoadStart).toHaveBeenCalledWith({ type: 'image', src: '/files/a.png' });

    rerender(<DocViewer src="/files/b.png" onDocumentLoadStart={onDocumentLoadStart} />);
    expect(onDocumentLoadStart).toHaveBeenLastCalledWith({ type: 'image', src: '/files/b.png' });
    expect(onDocumentLoadStart).toHaveBeenCalledTimes(2);
  });
});

describe('controller.canPrint and controller.type', () => {
  beforeEach(() => getDocument.mockReset());

  it('reports an image once it has loaded', () => {
    const controller = createRef<DocViewerController>();
    render(<DocViewer src="/files/photo.png" controllerRef={controller} />);
    expect(controller.current!.type).toBe('image');
    expect(controller.current!.canPrint).toBe(false);

    const image = screen.getByRole('img', { hidden: true });
    Object.defineProperty(image, 'naturalWidth', { value: 80 });
    Object.defineProperty(image, 'naturalHeight', { value: 40 });
    fireEvent.load(image);
    expect(controller.current!.canPrint).toBe(true);
  });

  it('reports a PDF once it has loaded', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(<DocViewer src="/files/a.pdf" pdfWorkerSrc="/w.mjs" controllerRef={controller} />);
    expect(controller.current!.type).toBe('pdf');
    expect(controller.current!.canPrint).toBe(false);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(controller.current!.canPrint).toBe(true);
  });

  it('reports text once it has loaded', async () => {
    mockFetch('hello');
    const controller = createRef<DocViewerController>();
    render(<DocViewer src="/files/a.txt" controllerRef={controller} />);
    expect(controller.current!.canPrint).toBe(false);
    await screen.findByText('hello');
    expect(controller.current!.canPrint).toBe(true);
  });

  it('cannot print files the viewer does not show', () => {
    const controller = createRef<DocViewerController>();
    render(<DocViewer src="/files/a.zip" controllerRef={controller} />);
    expect(controller.current!.type).toBe('unknown');
    expect(controller.current!.canPrint).toBe(false);
  });

  it('falls back once the viewer is gone', () => {
    const controller = createRef<DocViewerController>();
    const { unmount } = render(<DocViewer src="/files/photo.png" controllerRef={controller} />);
    const { current } = controller;
    unmount();
    expect(current!.type).toBe('unknown');
    expect(current!.canPrint).toBe(false);
  });
});
