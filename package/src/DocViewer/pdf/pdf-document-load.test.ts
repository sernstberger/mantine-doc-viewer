import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfWorkerNotConfiguredError } from './load-pdfjs';
import {
  buildLoadParameters,
  DEFAULT_PDF_LOAD_OPTIONS,
  getPdfTitle,
  isIncorrectPassword,
  readFirstPageSize,
  toErrorState,
} from './pdf-document-load';

const docWith = (getMetadata: () => Promise<unknown>) =>
  ({ getMetadata }) as unknown as PDFDocumentProxy;

describe('buildLoadParameters', () => {
  it('uses the url without data, over the defaults and options', () => {
    expect(buildLoadParameters({ disableStream: false }, 'a.pdf', null)).toEqual({
      ...DEFAULT_PDF_LOAD_OPTIONS,
      disableStream: false,
      url: 'a.pdf',
    });
  });

  it('gives pdf.js a copy of the data instead of the url', () => {
    const data = new Uint8Array([1, 2]);
    const params = buildLoadParameters(undefined, 'a.pdf', data);
    expect(params.url).toBeUndefined();
    expect(params.data).toEqual(data);
    expect(params.data).not.toBe(data);
  });
});

describe('toErrorState', () => {
  it('flags a missing worker', () => {
    const error = new PdfWorkerNotConfiguredError();
    expect(toErrorState(error)).toEqual({ status: 'error', error, reason: 'worker' });
  });

  it('flags any other error as a load failure', () => {
    const error = new Error('bad');
    expect(toErrorState(error)).toEqual({ status: 'error', error, reason: 'load' });
  });
});

describe('isIncorrectPassword', () => {
  it('is true only for reason 2', () => {
    expect(isIncorrectPassword(2)).toBe(true);
    expect(isIncorrectPassword(1)).toBe(false);
  });
});

describe('getPdfTitle', () => {
  it('trims the title', async () => {
    expect(await getPdfTitle(docWith(async () => ({ info: { Title: '  Hi ' } })))).toBe('Hi');
  });

  it('is undefined for a blank or non-string title', async () => {
    expect(await getPdfTitle(docWith(async () => ({ info: { Title: '  ' } })))).toBeUndefined();
    expect(await getPdfTitle(docWith(async () => ({ info: { Title: 3 } })))).toBeUndefined();
  });

  it('is undefined when the metadata cannot be read', async () => {
    const reject = async () => {
      throw new Error('x');
    };
    expect(await getPdfTitle(docWith(reject))).toBeUndefined();
  });
});

describe('readFirstPageSize', () => {
  it('reads the viewport of page 1 at scale 1', async () => {
    const getViewport = jest.fn(() => ({ width: 10, height: 20, extra: 1 }));
    const getPage = jest.fn(async () => ({ getViewport }));
    const size = await readFirstPageSize({ getPage } as unknown as PDFDocumentProxy);
    expect(getPage).toHaveBeenCalledWith(1);
    expect(getViewport).toHaveBeenCalledWith({ scale: 1 });
    expect(size).toEqual({ width: 10, height: 20 });
  });
});
