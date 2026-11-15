import { act, renderHook, waitFor } from '@testing-library/react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { decodeText, formatFileSize, useDocViewerText } from './use-doc-viewer-text';

describe('useDocViewerText', () => {
  it('loads the text', async () => {
    mockFetch('hello world');
    const { result } = renderHook(() => useDocViewerText('/notes.txt', 100));
    expect(result.current.status).toBe('loading');
    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        text: 'hello world',
        size: 11,
        mimeType: undefined,
      })
    );
  });

  it('refuses files larger than the limit from the content-length header', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    const { result } = renderHook(() => useDocViewerText('/big.log', 100));
    await waitFor(() => expect(result.current).toEqual({ status: 'too-large', size: 5000 }));
  });

  it('refuses files larger than the limit when the size is not declared', async () => {
    mockFetch('x'.repeat(200));
    const { result } = renderHook(() => useDocViewerText('/big.log', 100));
    await waitFor(() => expect(result.current).toEqual({ status: 'too-large', size: 200 }));
  });

  it('reports failed requests', async () => {
    mockFetch('Not found', { status: 404 });
    const { result } = renderHook(() => useDocViewerText('/missing.txt', 100));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('formats file sizes', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  describe('without a body reader', () => {
    function respondWithoutBody(bytes: Uint8Array) {
      window.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          body: null,
          arrayBuffer: () => Promise.resolve(bytes.buffer),
        })
      ) as unknown as typeof fetch;
    }

    it('reads the whole response', async () => {
      respondWithoutBody(new TextEncoder().encode('no reader'));
      const { result } = renderHook(() => useDocViewerText('/a.txt', 100));
      await waitFor(() =>
        expect(result.current).toMatchObject({ status: 'ready', text: 'no reader' })
      );
    });

    it('refuses a response that is too large', async () => {
      respondWithoutBody(new Uint8Array(3000));
      const { result } = renderHook(() => useDocViewerText('/a.txt', 2000));
      await waitFor(() => expect(result.current).toEqual({ status: 'too-large', size: 3000 }));
    });
  });

  it('decodes with the charset the server names, UTF-8 when it names none or an unknown one', () => {
    const bytes = new TextEncoder().encode('café');
    expect(decodeText(bytes, 'text/plain; charset=nonsense-9')).toBe('café');
    expect(decodeText(bytes, 'text/plain')).toBe('café');
    expect(decodeText(bytes, null)).toBe('café');
    expect(decodeText(bytes, 'text/plain; charset="utf-8"')).toBe('café');
  });

  it('ignores results that arrive after unmounting', async () => {
    let finish: (value: unknown) => void = () => {};
    window.fetch = jest.fn(
      () => new Promise((resolve) => (finish = resolve))
    ) as unknown as typeof fetch;
    renderHook(() => useDocViewerText('/a.txt', 100)).unmount();
    await act(async () => {
      finish({ ok: true, status: 200, headers: new Headers(), body: null });
    });

    let fail: (reason: unknown) => void = () => {};
    window.fetch = jest.fn(
      () => new Promise((_, reject) => (fail = reject))
    ) as unknown as typeof fetch;
    renderHook(() => useDocViewerText('/b.txt', 100)).unmount();
    await act(async () => fail(new Error('aborted')));
  });

  it('reports a request that fails', async () => {
    window.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    const { result } = renderHook(() => useDocViewerText('/a.txt', 100));
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'error', error: new Error('offline') })
    );
  });
});
