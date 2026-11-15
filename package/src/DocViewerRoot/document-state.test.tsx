import { render, screen } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer, type TestDocViewerProps } from '../../../test-utils/viewer';
import { createDocViewerStore } from '../doc-viewer.store';

function renderWithStore(props: TestDocViewerProps) {
  const store = createDocViewerStore();
  return { store, ...render(<TestDocViewer store={store} {...props} />) };
}

describe('type and canPrint in the store', () => {
  beforeEach(() => getDocument.mockReset());

  it('reports an image once it has loaded', () => {
    const { store } = renderWithStore({ src: '/files/photo.png' });
    expect(store.getState().type).toBe('image');
    expect(store.getState().canPrint).toBe(false);

    const image = screen.getByRole('img', { hidden: true });
    Object.defineProperty(image, 'naturalWidth', { value: 80 });
    Object.defineProperty(image, 'naturalHeight', { value: 40 });
    fireEvent.load(image);
    expect(store.getState().canPrint).toBe(true);
  });

  it('reports a PDF once it has loaded', async () => {
    mockPdf();
    const { store } = renderWithStore({ src: '/files/a.pdf' });
    expect(store.getState().type).toBe('pdf');
    expect(store.getState().canPrint).toBe(false);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(store.getState().canPrint).toBe(true);
  });

  it('reports text once it has loaded', async () => {
    mockFetch('hello');
    const { store } = renderWithStore({ src: '/files/a.txt' });
    expect(store.getState().canPrint).toBe(false);
    await screen.findByText('hello');
    expect(store.getState().canPrint).toBe(true);
  });

  it('cannot print files the viewer does not show', () => {
    const { store } = renderWithStore({ src: '/files/a.zip' });
    expect(store.getState().type).toBe('unknown');
    expect(store.getState().canPrint).toBe(false);
  });

  it('keeps the last state in the store once the viewer is gone', () => {
    const { store, unmount } = renderWithStore({ src: '/files/photo.png' });
    unmount();
    expect(store.getState().type).toBe('image');
    expect(store.getState().canPrint).toBe(false);
  });
});

describe('onDocumentLoad details', () => {
  beforeEach(() => getDocument.mockReset());

  const loaded = (onDocumentLoad: jest.Mock) =>
    waitFor(() => expect(onDocumentLoad).toHaveBeenCalled());

  it('gives a PDF its size, MIME type and title', async () => {
    mockPdf({ total: 48_000 });
    const onDocumentLoad = jest.fn();
    render(<TestDocViewer src="/a.pdf" onDocumentLoad={onDocumentLoad} />);
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
      <TestDocViewer src="/a.pdf" mimeType="application/x-pdf" onDocumentLoad={onDocumentLoad} />
    );
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined, mimeType: 'application/x-pdf' })
    );
    unmount();

    mockPdf({ info: 'fail' });
    const failed = jest.fn();
    render(<TestDocViewer src="/a.pdf" onDocumentLoad={failed} />);
    await loaded(failed);
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ title: undefined }));
  });

  it('gives text its size and the MIME type the server sent', async () => {
    mockFetch('hello', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const onDocumentLoad = jest.fn();
    render(<TestDocViewer src="/a.txt" onDocumentLoad={onDocumentLoad} />);
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
    const { unmount } = render(<TestDocViewer src="/a.txt" onDocumentLoad={onDocumentLoad} />);
    await loaded(onDocumentLoad);
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'text', byteSize: 5, mimeType: undefined });
    unmount();

    mockFetch('hello', { headers: { 'content-type': 'text/plain' } });
    const withProp = jest.fn();
    render(<TestDocViewer src="/a.txt" mimeType="text/x-note" onDocumentLoad={withProp} />);
    await loaded(withProp);
    expect(withProp).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'text/x-note' }));
  });

  it('gives an image the mimeType prop', () => {
    const onDocumentLoad = jest.fn();
    render(
      <TestDocViewer
        src="/photo"
        mimeType="image/webp"
        type="image"
        onDocumentLoad={onDocumentLoad}
      />
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
