/** Test helpers for PDF views: a fake pdf.js document set up through the mocked getDocument */
import * as pdfjs from 'pdfjs-dist';

// `pdfjs-dist` resolves to test-utils/pdfjs-dist.mock.ts, see jest.config.cjs
export const getDocument = pdfjs.getDocument as unknown as jest.Mock;

export const PAGE_TEXT = [
  [
    { str: 'Quarterly report', hasEOL: true },
    { str: 'Revenue grew this quarter.', hasEOL: true },
  ],
  [{ str: 'Costs fell', hasEOL: true }],
  [{ str: 'Next quarter outlook', hasEOL: true }],
];

export function mockPdf({
  numPages = 3,
  fail = false,
  unreadablePage = 0,
  outline = null as unknown[] | null,
  password = '',
  links = [] as unknown[],
  layers = [] as { id: string; name: string; visible: boolean }[],
  attachments = null as Map<string, { filename: string; description: string }> | null,
} = {}) {
  // One render mock shared by all pages, so tests can count renders across the document
  const page = {
    render: jest.fn(() => ({ promise: Promise.resolve(), cancel: jest.fn() })),
    cleanup: jest.fn(() => true),
  };
  const pages = Array.from({ length: numPages }, (_, index) => ({
    rotate: 0,
    getViewport: ({ scale, rotation = 0 }: { scale: number; rotation?: number }) => {
      const quarter = rotation % 180 !== 0;
      const viewport = {
        width: (quarter ? 792 : 612) * scale,
        height: (quarter ? 612 : 792) * scale,
      };
      return { ...viewport, clone: () => viewport };
    },
    render: page.render,
    cleanup: page.cleanup,
    getAnnotations: jest.fn(() => Promise.resolve(index === 0 ? links : [])),
    view: [0, 0, 612, 792],
    getTextContent: jest.fn(() =>
      index + 1 === unreadablePage
        ? Promise.reject(new Error('Corrupt content stream'))
        : Promise.resolve({ items: PAGE_TEXT[index] ?? [], styles: {} })
    ),
  }));
  const document = {
    numPages,
    getPage: jest.fn((pageNumber: number) => Promise.resolve(pages[pageNumber - 1])),
    getOutline: jest.fn(() => Promise.resolve(outline)),
    getDestination: jest.fn((name: string) =>
      Promise.resolve(name === 'costs' ? [{ num: 7 }] : null)
    ),
    getPageIndex: jest.fn(() => Promise.resolve(1)),
    getData: jest.fn(() => Promise.resolve(new Uint8Array([37, 80, 68, 70]))),
    extractPages: jest.fn(() => Promise.resolve(new Uint8Array([37, 80, 68, 70, 45]))),
    getMetadata: jest.fn(() =>
      Promise.resolve({
        info: {
          Title: 'Quarterly report',
          Author: 'Finance',
          CreationDate: 'D:20240131120000Z',
          PDFFormatVersion: '1.7',
        },
      })
    ),
    getDownloadInfo: jest.fn(() => Promise.resolve({ length: 2048 })),
    getAttachments: jest.fn(() => Promise.resolve(attachments)),
    getAttachmentContent: jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
    getOptionalContentConfig: jest.fn(() => {
      const groups = new Map(layers.map((layer) => [layer.id, { ...layer }]));
      return Promise.resolve({
        [Symbol.iterator]: () => groups[Symbol.iterator](),
        setVisibility: (id: string, visible: boolean) => {
          groups.get(id)!.visible = visible;
        },
      });
    }),
  };
  getDocument.mockImplementation(() => {
    const task: {
      promise?: Promise<unknown>;
      destroy: jest.Mock;
      onPassword?: (update: (value: string) => void, reason: number) => void;
    } = { destroy: jest.fn(() => Promise.resolve()) };

    // Like pdf.js: asks for the password through onPassword until the right one is given
    task.promise = fail
      ? Promise.reject(new Error('Invalid PDF structure'))
      : !password
        ? Promise.resolve(document)
        : new Promise((resolve) => {
            const ask = (reason: number) =>
              task.onPassword?.(
                (value) => (value === password ? resolve(document) : ask(2)),
                reason
              );
            setTimeout(() => ask(1));
          });

    return task;
  });

  return { page };
}
