import { act, render } from '@testing-library/react';
import React from 'react';
import { DocViewerProvider } from '../../doc-viewer.context';
import { keepSize } from '../../utils/page-canvas-ref';
import { usePageCanvas } from '../../hooks/pdf/use-page-canvas';
import { usePagePreview } from '../../hooks/pdf/use-page-preview';

function fakePage() {
  return {
    rotate: 0,
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render: jest.fn(() => ({ promise: Promise.resolve(), cancel: jest.fn() })),
    cleanup: jest.fn(),
  };
}

function fakeDocument(getPage: () => Promise<unknown>) {
  return { numPages: 1, getPage: jest.fn(getPage) } as any;
}

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const sizes: unknown[] = [];

function Page({ document, near, scale = 1 }: { document: any; near: boolean; scale?: number }) {
  const { canvasRef, size } = usePageCanvas({
    document,
    pageNumber: 1,
    scale,
    rotation: 0,
    near,
    maxCanvasPixels: undefined,
  });
  sizes.push(size);
  return <div>{near && <canvas ref={canvasRef} />}</div>;
}

function Preview({ document, near }: { document: any; near: boolean }) {
  const { canvasRef } = usePagePreview({ document, pageNumber: 1, width: 100, near });
  return <div>{near && <canvas ref={canvasRef} />}</div>;
}

function withContext(children: React.ReactNode) {
  return <DocViewerProvider value={{} as any}>{children}</DocViewerProvider>;
}

beforeEach(() => {
  sizes.length = 0;
});

describe('keepSize', () => {
  it('keeps the current object while the size holds', () => {
    const current = { width: 1, height: 2 };
    expect(keepSize(current, { width: 1, height: 2 })).toBe(current);
    const wider = { width: 3, height: 2 };
    expect(keepSize(current, wider)).toBe(wider);
    const taller = { width: 1, height: 3 };
    expect(keepSize(current, taller)).toBe(taller);
    expect(keepSize(null, wider)).toBe(wider);
  });
});

describe('page canvases', () => {
  it('empties the page canvas when the page leaves the viewport', async () => {
    const document = fakeDocument(() => Promise.resolve(fakePage()));
    const view = render(<Page document={document} near />);
    await flush();
    const canvas = view.container.querySelector('canvas')!;
    expect(canvas.width).toBeGreaterThan(0);
    view.rerender(<Page document={document} near={false} />);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it('empties the thumbnail canvas when the thumbnail leaves the viewport', async () => {
    const document = fakeDocument(() => Promise.resolve(fakePage()));
    const view = render(withContext(<Preview document={document} near />));
    await flush();
    const canvas = view.container.querySelector('canvas')!;
    expect(canvas.width).toBeGreaterThan(0);
    view.rerender(withContext(<Preview document={document} near={false} />));
    expect(canvas.width).toBe(0);
  });

  it('keeps the same size object when zooming, so the page does not render again for it', async () => {
    const document = fakeDocument(() => Promise.resolve(fakePage()));
    const view = render(<Page document={document} near />);
    await flush();
    const first = sizes[sizes.length - 1];
    expect(first).toEqual({ width: 612, height: 792 });
    view.rerender(<Page document={document} near scale={2} />);
    await flush();
    expect(new Set(sizes.filter(Boolean))).toEqual(new Set([first]));
  });

  it('handles a page request rejected because the document was destroyed', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    const destroyed = () => Promise.reject(new Error('Worker was destroyed'));
    render(<Page document={fakeDocument(destroyed)} near />);
    render(withContext(<Preview document={fakeDocument(destroyed)} near />));
    await flush();
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
