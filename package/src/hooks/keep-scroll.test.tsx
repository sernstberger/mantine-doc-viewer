import { render, screen } from '@mantine-tests/core';
import { fireEvent, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import { useKeepScroll } from './keep-scroll';

function scrollTo(node: HTMLElement, top: number, left = 0) {
  node.scrollTop = top;
  node.scrollLeft = left;
  fireEvent.scroll(node);
}

function loadImage() {
  const image = screen.getByRole('img', { hidden: true });
  Object.defineProperty(image, 'naturalWidth', { value: 80, configurable: true });
  Object.defineProperty(image, 'naturalHeight', { value: 40, configurable: true });
  fireEvent.load(image);
  return image;
}

describe('useKeepScroll', () => {
  type Input = { ready: boolean; src: string; enabled: boolean };

  const setup = (initial: Input) => {
    const node = document.createElement('div');
    const hook = renderHook(
      (props: Input) => useKeepScroll(node, props.ready, props.src, props.enabled),
      {
        initialProps: initial,
      }
    );
    return { node, ...hook };
  };

  it('puts the position back once the new document is ready', () => {
    const { node, rerender } = setup({ ready: true, src: 'a', enabled: true });
    scrollTo(node, 300, 20);

    rerender({ ready: true, src: 'b', enabled: true });
    rerender({ ready: false, src: 'b', enabled: true });
    // The browser moves a shorter, loading document to the top
    scrollTo(node, 0);
    rerender({ ready: true, src: 'b', enabled: true });
    expect(node.scrollTop).toBe(300);
    expect(node.scrollLeft).toBe(20);

    // Only once per swap
    node.scrollTop = 40;
    rerender({ ready: false, src: 'b', enabled: true });
    rerender({ ready: true, src: 'b', enabled: true });
    expect(node.scrollTop).toBe(40);
  });

  it('does nothing when it is off', () => {
    const { node, rerender } = setup({ ready: true, src: 'a', enabled: false });
    scrollTo(node, 300);
    rerender({ ready: true, src: 'b', enabled: false });
    rerender({ ready: false, src: 'b', enabled: false });
    rerender({ ready: true, src: 'b', enabled: false });
    expect(node.scrollTop).toBe(300);

    node.scrollTop = 0;
    rerender({ ready: false, src: 'c', enabled: false });
    rerender({ ready: true, src: 'c', enabled: false });
    expect(node.scrollTop).toBe(0);
  });
});

describe('keepView', () => {
  beforeEach(() => getDocument.mockReset());

  it('keeps zoom, rotation and the image element when an image swaps', async () => {
    const { rerender } = render(<DocViewer src="/a.png" keepView defaultZoom={1} />);
    const image = loadImage();
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));

    rerender(
      <>
        <DocViewer src="/b.png" keepView defaultZoom={1} />
      </>
    );
    expect(screen.getByRole('img', { hidden: true })).toBe(image);
    expect(image).toHaveAttribute('src', '/b.png');
    expect(image.style.transform).toContain('rotate(90deg)');
  });

  it('tries a new image after the last one failed', () => {
    const { rerender } = render(<DocViewer src="/a.png" keepView />);
    fireEvent.error(screen.getByRole('img', { hidden: true }));
    expect(screen.getByText('This image could not be loaded')).toBeInTheDocument();

    rerender(
      <>
        <DocViewer src="/b.png" keepView />
      </>
    );
    expect(screen.queryByText('This image could not be loaded')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('src', '/b.png');
  });

  it('starts afresh without keepView', async () => {
    const { rerender } = render(<DocViewer src="/a.png" defaultZoom={1} />);
    const image = loadImage();

    rerender(
      <>
        <DocViewer src="/b.png" defaultZoom={1} />
      </>
    );
    expect(screen.getByRole('img', { hidden: true })).not.toBe(image);
  });

  it('keeps line wrapping and scroll when text swaps', async () => {
    mockFetch('first file');
    const { rerender } = render(<DocViewer src="/a.txt" keepView />);
    const text = await screen.findByText('first file');
    await userEvent.click(screen.getByRole('button', { name: 'Wrap lines' }));
    const body = text.parentElement as HTMLElement;
    scrollTo(body, 120);

    mockFetch('second file');
    rerender(
      <>
        <DocViewer src="/b.txt" keepView />
      </>
    );
    scrollTo(body, 0);
    const next = await screen.findByText('second file');
    expect(next).not.toHaveAttribute('data-wrap');
    expect(body.scrollTop).toBe(120);
  });

  it('keeps zoom and scroll when a PDF swaps, and forgets edits of the old one', async () => {
    mockPdf();
    const props = { pdfWorkerSrc: '/w.mjs', keepView: true } as const;
    const { rerender } = render(<DocViewer src="/a.pdf" {...props} />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    const zoom = screen.getByRole('button', { name: /Reset zoom/ }).textContent;
    const body = screen.getAllByRole('region')[0] as HTMLElement;
    scrollTo(body, 500);

    rerender(
      <>
        <DocViewer src="/b.pdf" {...props} />
      </>
    );
    scrollTo(body, 0);
    await waitFor(() => expect(body.scrollTop).toBe(500));
    expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent(zoom!);
    expect(getDocument).toHaveBeenCalledTimes(2);
  });
});
