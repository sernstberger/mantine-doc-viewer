import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';

// jsdom has no TextEncoder or TextDecoder
if (typeof window.TextDecoder === 'undefined') {
  (window as any).TextDecoder = NodeTextDecoder;
  (window as any).TextEncoder = NodeTextEncoder;
}

interface MockFetchInit {
  status?: number;
  headers?: Record<string, string>;

  /** Body bytes to send instead of `body` encoded as UTF-8 */
  bytes?: Uint8Array;

  /** Size of each chunk the body is read in, in bytes */
  chunkSize?: number;
}

/** Replaces window.fetch with one that answers every request with `body`, streamed in chunks */
export function mockFetch(body: string, init: MockFetchInit = {}) {
  const fetch = jest.fn(() => {
    const bytes = init.bytes ?? new NodeTextEncoder().encode(body);
    const chunkSize = init.chunkSize ?? 1024;
    let offset = 0;
    const read = jest.fn(() => {
      if (offset >= bytes.byteLength) {
        return Promise.resolve({ done: true, value: undefined });
      }
      const value = bytes.subarray(offset, offset + chunkSize);
      offset += chunkSize;
      return Promise.resolve({ done: false, value });
    });

    return Promise.resolve({
      ok: (init.status ?? 200) < 400,
      status: init.status ?? 200,
      headers: new Headers(init.headers),
      body: { getReader: () => ({ read }) },
      read,
    });
  });
  window.fetch = fetch as any;
  return fetch;
}
