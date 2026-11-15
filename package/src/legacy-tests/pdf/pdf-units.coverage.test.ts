import { act, renderHook, waitFor } from '@testing-library/react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjs from 'pdfjs-dist';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import {
  downloadAttachment,
  getPdfProperties,
  parsePdfDate,
  usePdfAttachments,
  usePdfProperties,
} from '../../utils/document-info';
import { addHighlightRanges, supportsHighlights } from '../../utils/highlights';
import { createLinkService } from '../../utils/link-service';
import { PdfWorkerNotConfiguredError } from '../../DocViewerAdapterProvider/adapters/pdfjs-adapter';
import { createTestPdfAdapter } from '../../../../test-utils/adapters';
import { setNextPdfJsImport } from '../../../../test-utils/import-pdfjs.mock';
import { getResolvedOutline, usePdfOutline } from '../../DocViewerOutline/PdfOutline';
import {
  getCanvasPixelRatio,
  getPageViewport,
  renderPageToCanvas,
  rotateSize,
} from '../../utils/render-page';
import {
  buildPageText,
  findMatches,
  getMatchRanges,
  getMatchSegments,
  normalizeForSearch,
} from '../../utils/search';
import { usePdfDocument } from '../../hooks/pdf/use-pdf-document';
import { usePdfLayers } from '../../hooks/pdf/use-pdf-layers';
import { usePdfSearch } from '../../hooks/pdf/use-pdf-search';
import { useSearchHighlights, useTextLayers } from '../../hooks/pdf/use-search-highlights';

const asDocument = (value: unknown) => value as PDFDocumentProxy;

/** Renders a hook for a fake document, which must be the same object on every render */
function renderFor<T>(use: (document: PDFDocumentProxy) => T, document: unknown) {
  const stable = asDocument(document);
  return renderHook(() => use(stable));
}

afterEach(() => {
  jest.restoreAllMocks();
  getDocument.mockReset();
});

describe('createPdfJsAdapter', () => {
  it('loads pdf.js once, applies the worker and reports a missing worker', async () => {
    const adapter = createTestPdfAdapter('/worker.mjs');
    const engine = await adapter.load();
    expect(engine.GlobalWorkerOptions.workerSrc).toBe('/worker.mjs');
    expect(await adapter.load()).toBe(engine);
    expect(await createTestPdfAdapter().load()).toBe(engine);

    engine.GlobalWorkerOptions.workerSrc = '';
    await expect(createTestPdfAdapter().load()).rejects.toBeInstanceOf(PdfWorkerNotConfiguredError);
    await expect(createTestPdfAdapter('').load()).rejects.toThrow('workerSrc');
  });

  it('forgets a failed import so the next call tries again', async () => {
    const adapter = createTestPdfAdapter('/worker.mjs');
    const failure = new Error('network down');
    setNextPdfJsImport(() => Promise.reject(failure));
    await expect(adapter.load()).rejects.toBe(failure);
    expect((await adapter.load()).GlobalWorkerOptions.workerSrc).toBe('/worker.mjs');
  });

  it('gives getDocument options, as an object or per document', () => {
    expect(createTestPdfAdapter('/w', { password: 'a' }).getOptions!('/x.pdf')).toEqual({
      password: 'a',
    });
    expect(
      createTestPdfAdapter('/w', (src) => ({ httpHeaders: { src } })).getOptions!('/x.pdf')
    ).toEqual({ httpHeaders: { src: '/x.pdf' } });
  });
});

describe('render-page', () => {
  const page = (render = jest.fn()) =>
    ({
      rotate: 90,
      getViewport: jest.fn(({ scale, rotation }: { scale: number; rotation: number }) => ({
        width: 100 * scale,
        height: 200 * scale,
        rotation,
      })),
      render,
    }) as unknown as PDFPageProxy;

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
  });

  it('adds the viewer rotation to the page rotation, with none by default', () => {
    expect(getPageViewport(page(), 2)).toMatchObject({ width: 200, rotation: 90 });
    expect(getPageViewport(page(), 1, 270)).toMatchObject({ rotation: 0 });
  });

  it('swaps the size for quarter turns', () => {
    expect(rotateSize({ width: 1, height: 2 }, 0)).toEqual({ width: 1, height: 2 });
    expect(rotateSize({ width: 1, height: 2 }, 90)).toEqual({ width: 2, height: 1 });
  });

  it('lowers the pixel ratio for huge canvases', () => {
    expect(getCanvasPixelRatio(0, 10, 2, 100)).toBe(2);
    expect(getCanvasPixelRatio(10, 10, 2, 400)).toBe(2);
    expect(getCanvasPixelRatio(10, 10, 2, 100)).toBe(1);
  });

  it('draws at a pixel ratio of 1 without a transform, and without layers by default', () => {
    const render = jest.fn(() => ({ promise: Promise.resolve() }));
    const canvas = document.createElement('canvas');
    renderPageToCanvas(page(render), canvas, 1);

    expect(canvas.width).toBe(100);
    expect(render).toHaveBeenCalledWith({
      canvas,
      viewport: expect.anything(),
      transform: undefined,
    });
  });

  it('draws at the screen density, with the layers it is given', () => {
    // 0 is what some environments report, and means 1
    Object.defineProperty(window, 'devicePixelRatio', { value: 0, configurable: true });
    const render = jest.fn();
    const canvas = document.createElement('canvas');
    renderPageToCanvas(page(render), canvas, 1, undefined, 0, undefined);
    expect(render.mock.calls[0][0].transform).toBeUndefined();

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    const config = { layers: true } as never;
    renderPageToCanvas(page(render), canvas, 1, 2 ** 24, 90, config);
    expect(canvas.width).toBe(200);
    expect(render.mock.calls[1][0]).toMatchObject({ transform: [2, 0, 0, 2, 0, 0] });
    expect(render.mock.calls[1][0].optionalContentConfigPromise).toBeInstanceOf(Promise);
  });
});

describe('search', () => {
  it('keeps characters whose normalized form has another length', () => {
    expect(normalizeForSearch('İx', { matchAccents: true })).toBe('İx');
    expect(normalizeForSearch('가x', { matchCase: true })).toBe('가x');
    expect(normalizeForSearch('Éx', { matchCase: true })).toBe('Ex');
    expect(normalizeForSearch('Éx', { matchCase: true, matchAccents: true })).toBe('Éx');
    expect(normalizeForSearch('Éx', { matchAccents: true })).toBe('éx');
  });

  it('finds whole words at the edges of the text', () => {
    const pages = [
      buildPageText([{ str: 'cat', hasEOL: false }]),
      buildPageText([{ str: 'cats', hasEOL: false }]),
    ];
    expect(findMatches(pages, 'cat', { wholeWords: true })).toEqual([
      { pageNumber: 1, start: 0, end: 3 },
    ]);
    expect(findMatches(pages, '  ')).toEqual([]);
  });

  it('splits matches across text items', () => {
    const items = [
      { str: 'Hello ', hasEOL: false },
      { str: 'wor', hasEOL: false },
      { str: 'ld', hasEOL: true },
    ];
    const text = buildPageText(items);
    const [match] = findMatches([text], 'o wor');
    expect(getMatchSegments(text, match, items)).toEqual([
      { itemIndex: 0, start: 4, end: 6 },
      { itemIndex: 1, start: 0, end: 3 },
    ]);
    expect(getMatchSegments(buildPageText([]), match, [])).toEqual([]);
  });

  it('makes ranges only for text nodes that hold the segment', () => {
    const withText = document.createElement('span');
    withText.textContent = 'Hello';
    const withElement = document.createElement('span');
    withElement.append(document.createElement('b'));
    const empty = document.createElement('span');
    const fake = {
      firstChild: { nodeType: Node.TEXT_NODE, textContent: null },
    } as unknown as HTMLElement;

    const segments = [0, 1, 2, 3, 4].map((itemIndex) => ({ itemIndex, start: 0, end: 3 }));
    const ranges = getMatchRanges(segments, [withText, withElement, empty, fake]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].toString()).toBe('Hel');

    // The text is shorter than the segment
    expect(getMatchRanges([{ itemIndex: 0, start: 0, end: 9 }], [withText])).toEqual([]);
  });
});

describe('highlights', () => {
  it('reports that the CSS highlight API is missing in jsdom', () => {
    expect(supportsHighlights()).toBe(false);
    expect(addHighlightRanges('mantine-doc-viewer-match', [document.createRange()])).toEqual(
      expect.any(Function)
    );
  });
});

describe('link-service', () => {
  it('ignores destinations that cannot be resolved, and does nothing for layers and attachments', async () => {
    const goToDestination = jest.fn();
    const service = createLinkService(
      asDocument({ getDestination: jest.fn(() => Promise.reject(new Error('bad'))) }),
      { numPages: 3, getCurrentPage: () => 1, goToDestination, onLinkClick: jest.fn() }
    );

    await service.goToDestination('missing');
    expect(goToDestination).not.toHaveBeenCalled();
    expect(service.executeSetOCGState()).toBeUndefined();
    await expect(service.getAttachmentContent()).resolves.toBeNull();
  });
});

describe('document-info', () => {
  it('leaves out dates that do not exist, and reads the modification date', () => {
    expect(parsePdfDate('D:20241301000000Z')).toBeNull();
    const properties = getPdfProperties(
      { ModDate: 'D:20240131120000Z', CreationDate: 'nothing' },
      { pageCount: 1 },
      (date) => date.toISOString()
    );
    expect(properties).toEqual([
      { key: 'modified', value: '2024-01-31T12:00:00.000Z' },
      { key: 'pageCount', value: '1' },
    ]);
  });

  it('shows what it can when metadata, size and first page cannot be read', async () => {
    const document = asDocument({
      numPages: 4,
      getMetadata: () => Promise.reject(new Error('no metadata')),
      getDownloadInfo: () => Promise.reject(new Error('no size')),
      getPage: () => Promise.reject(new Error('no page')),
    });
    const { result, rerender } = renderHook(({ opened }) => usePdfProperties(document, opened), {
      initialProps: { opened: false },
    });
    expect(result.current).toBeNull();

    rerender({ opened: true });
    await waitFor(() => expect(result.current).toEqual([{ key: 'pageCount', value: '4' }]));
  });

  it('does not set properties after unmounting', async () => {
    const document = asDocument({
      numPages: 1,
      getMetadata: () => Promise.resolve({ info: {} }),
      getDownloadInfo: () => Promise.resolve({ length: 10 }),
      getPage: () => Promise.resolve({ getViewport: () => ({ width: 1, height: 1 }) }),
    });
    const { result, unmount } = renderHook(() => usePdfProperties(document, true));
    unmount();
    await act(async () => {});
    expect(result.current).toBeNull();
  });

  it('lists attachments, tolerating a missing list, a failure and no document', async () => {
    const attachments = new Map([['a.txt', { filename: 'a.txt', description: '' }]]);
    const withList = renderFor(usePdfAttachments, {
      getAttachments: () => Promise.resolve(attachments),
    });
    await waitFor(() => expect(withList.result.current).toHaveLength(1));

    const withNull = renderFor(usePdfAttachments, { getAttachments: () => Promise.resolve(null) });
    await act(async () => {});
    expect(withNull.result.current).toEqual([]);

    const failing = renderFor(usePdfAttachments, {
      getAttachments: () => Promise.reject(new Error('bad')),
    });
    await act(async () => {});
    expect(failing.result.current).toEqual([]);

    const none = renderHook(() => usePdfAttachments(null));
    expect(none.result.current).toEqual([]);

    const cancelled = renderFor(usePdfAttachments, {
      getAttachments: () => Promise.resolve(attachments),
    });
    cancelled.unmount();
    await act(async () => {});
    expect(cancelled.result.current).toEqual([]);
  });

  it('saves nothing for an attachment without content', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:x');
    const document = asDocument({ getAttachmentContent: () => Promise.resolve(null) });
    await downloadAttachment(document, { id: 'a', filename: 'a.txt', description: '' });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('outline', () => {
  it('has no outline without a document, and an empty one when loading fails', async () => {
    const none = renderHook(() => usePdfOutline(null));
    expect(none.result.current).toBeNull();

    const failing = renderFor(usePdfOutline, {
      getOutline: () => Promise.reject(new Error('bad')),
    });
    await waitFor(() => expect(failing.result.current).toEqual([]));

    const missing = renderFor(usePdfOutline, { getOutline: () => Promise.resolve(null) });
    await waitFor(() => expect(missing.result.current).toEqual([]));

    const cancelled = renderFor(usePdfOutline, {
      getOutline: () => Promise.reject(new Error('bad')),
    });
    cancelled.unmount();
    await act(async () => {});
    expect(cancelled.result.current).toBeNull();

    const cancelledLoad = renderFor(usePdfOutline, { getOutline: () => Promise.resolve([]) });
    cancelledLoad.unmount();
    await act(async () => {});
    expect(cancelledLoad.result.current).toBeNull();
  });

  it('resolves pages of nested items, and leaves null for broken destinations', async () => {
    const document = asDocument({
      getDestination: (name: string) =>
        name === 'broken' ? Promise.reject(new Error('bad')) : Promise.resolve(null),
      getPageIndex: () => Promise.resolve(0),
    });
    const items = [
      {
        title: 'Parent',
        dest: [{ num: 1 }],
        url: undefined,
        items: [
          { title: 'Broken', dest: 'broken', items: [] },
          { title: 'Unknown', dest: 'unknown', items: [] },
          { title: 'Web', url: 'https://mantine.dev', dest: null, items: [] },
        ],
      },
    ];
    expect(await getResolvedOutline(document, items as never)).toEqual([
      {
        title: 'Parent',
        url: null,
        page: 1,
        items: [
          { title: 'Broken', url: null, page: null, items: [] },
          { title: 'Unknown', url: null, page: null, items: [] },
          { title: 'Web', url: 'https://mantine.dev', page: null, items: [] },
        ],
      },
    ]);
    expect(await getResolvedOutline(document, null)).toEqual([]);
  });
});

describe('use-pdf-document', () => {
  const flush = () => act(async () => {});
  const adapter = createTestPdfAdapter('/worker.mjs');

  it('does not open the document when it is unmounted while pdf.js loads', async () => {
    mockPdf();
    const { unmount } = renderHook(() => usePdfDocument('/a.pdf', adapter));
    unmount();
    await flush();
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('ignores a failing destroy when the document is replaced', async () => {
    mockPdf();
    const impl = getDocument.getMockImplementation()!;
    getDocument.mockImplementation((...args: unknown[]) => {
      const task = impl(...args);
      task.destroy = jest.fn(() => Promise.reject(new Error('already destroyed')));
      return task;
    });
    const { result, unmount } = renderHook(() => usePdfDocument('/a.pdf', adapter));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    unmount();
    await flush();
  });

  it('opens bytes instead of src, asks for the password again after a wrong one', async () => {
    mockPdf({ password: 'secret' });
    const bytes = new Uint8Array([1, 2]);
    const { result, unmount } = renderHook(() => usePdfDocument('/a.pdf', adapter, bytes));
    await waitFor(() => expect(result.current.status).toBe('password'));
    expect(getDocument.mock.calls[0][0]).toMatchObject({ data: expect.any(Uint8Array) });
    expect(getDocument.mock.calls[0][0]).not.toHaveProperty('url');

    act(() => (result.current as { submit: (value: string) => void }).submit('wrong'));
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: 'password', incorrect: true })
    );

    // A password asked for after unmounting is ignored
    unmount();
    await flush();
  });

  it('ignores a password request that arrives after unmounting', async () => {
    mockPdf({ password: 'secret' });
    const { unmount } = renderHook(() => usePdfDocument('/a.pdf', adapter));
    await waitFor(() => expect(getDocument).toHaveBeenCalled());
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('reports a worker that is not set', async () => {
    mockPdf();
    pdfjs.GlobalWorkerOptions.workerSrc = '';
    const noWorker = createTestPdfAdapter('');
    const { result } = renderHook(() => usePdfDocument('/a.pdf', noWorker));
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: 'error', reason: 'worker' })
    );
  });
});

describe('use-pdf-layers', () => {
  it('has no layers when the optional content cannot be read', async () => {
    const { result } = renderFor(usePdfLayers, {
      getOptionalContentConfig: () => Promise.reject(new Error('bad')),
    });
    await act(async () => {});
    expect(result.current.layers).toEqual([]);
    act(() => result.current.setVisible('x', true));
    expect(result.current.version).toBe(1);
  });

  it('has no layers without a document', () => {
    expect(renderHook(() => usePdfLayers(null)).result.current.config).toBeNull();
  });
});

describe('use-pdf-search', () => {
  it('searches with default options', async () => {
    mockPdf();
    const document = await getDocumentFor();
    const { result } = renderHook(() => usePdfSearch(document, 'quarter'));
    await waitFor(() => expect(result.current.matches).toHaveLength(3));

    // Stepping with no matches is ignored
    const none = renderHook(() => usePdfSearch(document, 'zzz'));
    await waitFor(() => expect(none.result.current.pages).not.toBeNull());
    act(() => none.result.current.next());
    expect(none.result.current.activeIndex).toBe(0);
  });
});

describe('use-search-highlights', () => {
  it('skips matches on pages that have no text', () => {
    const items = [{ str: 'cat', hasEOL: false }];
    const text = buildPageText(items);
    const { result } = renderHook(() => {
      const textLayers = useTextLayers();
      useSearchHighlights({
        textLayers,
        pages: [{ text, items }] as never,
        matches: [
          { pageNumber: 1, start: 0, end: 3 },
          { pageNumber: 2, start: 0, end: 3 },
        ],
        activeMatch: undefined,
        scrollRoot: null,
        scrollToPage: jest.fn(),
      } as never);
      return textLayers.onTextLayer;
    });
    const span = document.createElement('span');
    span.textContent = 'cat';
    act(() => {
      result.current(1, [span]);
      result.current(2, [span]);
    });
  });
});

async function getDocumentFor() {
  const task = getDocument({});
  return (await task.promise) as PDFDocumentProxy;
}
