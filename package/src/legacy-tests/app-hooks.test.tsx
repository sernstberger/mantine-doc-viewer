import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import React, { createRef, useEffect } from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import type { DocViewerController } from '../hooks/use-controller-registry';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import { DocViewerBody, DocViewerRenderer, useDocViewer } from '../DocViewerBody/DocViewerBody';

describe('onDocumentLoadStart', () => {
  it('is called on mount and again when src changes', () => {
    const onDocumentLoadStart = jest.fn();
    const { rerender } = render(
      <DocViewer src="/files/a.png" onDocumentLoadStart={onDocumentLoadStart} />
    );
    expect(onDocumentLoadStart).toHaveBeenCalledWith({ type: 'image', src: '/files/a.png' });

    rerender(
      <>
        <DocViewer src="/files/b.png" onDocumentLoadStart={onDocumentLoadStart} />
      </>
    );
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

describe('onDocumentLoad details', () => {
  beforeEach(() => getDocument.mockReset());

  const loaded = (onDocumentLoad: jest.Mock) =>
    waitFor(() => expect(onDocumentLoad).toHaveBeenCalled());

  it('gives a PDF its size, MIME type and title', async () => {
    mockPdf({ total: 48_000 });
    const onDocumentLoad = jest.fn();
    render(<DocViewer src="/a.pdf" pdfWorkerSrc="/w.mjs" onDocumentLoad={onDocumentLoad} />);
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'pdf',
      numPages: 3,
      byteSize: 48_000,
      mimeType: 'application/pdf',
      title: 'Quarterly report',
    });
  });

  it('leaves out a blank or unreadable PDF title, and prefers the mimeType prop', async () => {
    mockPdf({ info: { Title: '  ' } });
    const onDocumentLoad = jest.fn();
    const { unmount } = render(
      <DocViewer
        src="/a.pdf"
        mimeType="application/x-pdf"
        pdfWorkerSrc="/w.mjs"
        onDocumentLoad={onDocumentLoad}
      />
    );
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined, mimeType: 'application/x-pdf' })
    );
    unmount();

    mockPdf({ info: 'fail' });
    const failed = jest.fn();
    render(<DocViewer src="/a.pdf" pdfWorkerSrc="/w.mjs" onDocumentLoad={failed} />);
    await loaded(failed);
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ title: undefined }));
  });

  it('gives text its size and the MIME type the server sent', async () => {
    mockFetch('hello', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const onDocumentLoad = jest.fn();
    render(<DocViewer src="/a.txt" onDocumentLoad={onDocumentLoad} />);
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'text',
      byteSize: 5,
      mimeType: 'text/plain',
    });
  });

  it('leaves the MIME type out when nobody knows it, and uses the prop over the server', async () => {
    mockFetch('hello');
    const onDocumentLoad = jest.fn();
    const { unmount } = render(<DocViewer src="/a.txt" onDocumentLoad={onDocumentLoad} />);
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'text', byteSize: 5, mimeType: undefined });
    unmount();

    mockFetch('hello', { headers: { 'content-type': 'text/plain' } });
    const withProp = jest.fn();
    render(<DocViewer src="/a.txt" mimeType="text/x-note" onDocumentLoad={withProp} />);
    await loaded(withProp);
    expect(withProp).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'text/x-note' }));
  });

  it('gives an image the mimeType prop', () => {
    const onDocumentLoad = jest.fn();
    render(
      <DocViewer src="/photo" mimeType="image/webp" type="image" onDocumentLoad={onDocumentLoad} />
    );
    const image = screen.getByRole('img', { hidden: true });
    Object.defineProperty(image, 'naturalWidth', { value: 80 });
    Object.defineProperty(image, 'naturalHeight', { value: 40 });
    fireEvent.load(image);
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'image',
      width: 80,
      height: 40,
      mimeType: 'image/webp',
    });
  });
});

describe('onLoad and onError helpers for custom renderers', () => {
  function Sheet({ fail }: { fail?: boolean }) {
    const { onLoad, onError } = useDocViewer();
    useEffect(() => {
      fail ? onError(new Error('no sheet')) : onLoad({ numPages: 2 });
    }, [fail, onLoad, onError]);
    return <DocViewerBody>sheet</DocViewerBody>;
  }

  const renderers = (fail?: boolean): DocViewerRenderer[] => [
    {
      test: (file) => file.fileName?.endsWith('.csv') ?? false,
      render: () => <Sheet fail={fail} />,
    },
  ];

  it('onLoad reports the type and MIME type of the file with what it is given', () => {
    const onDocumentLoad = jest.fn();
    render(
      <DocViewer
        src="/files/data"
        fileName="data.csv"
        mimeType="text/csv"
        renderers={renderers()}
        onDocumentLoad={onDocumentLoad}
      />
    );
    expect(onDocumentLoad).toHaveBeenCalledWith({
      type: 'text',
      mimeType: 'text/csv',
      numPages: 2,
    });
  });

  it('onError reports the error', () => {
    const onDocumentError = jest.fn();
    render(
      <DocViewer
        src="/files/data"
        fileName="data.csv"
        renderers={renderers(true)}
        onDocumentError={onDocumentError}
      />
    );
    expect(onDocumentError).toHaveBeenCalledWith(new Error('no sheet'));
  });
});
