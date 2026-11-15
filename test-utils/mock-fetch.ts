/** Replaces window.fetch with one that answers every request with `body` */
export function mockFetch(
  body: string,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const blob = new Blob([body]);
  // jsdom's Blob has no text()
  (blob as any).text = () => Promise.resolve(body);
  const fetch = jest.fn(() =>
    Promise.resolve({
      ok: (init.status ?? 200) < 400,
      status: init.status ?? 200,
      headers: new Headers(init.headers),
      blob: () => Promise.resolve(blob),
    })
  );
  window.fetch = fetch as any;
  return fetch;
}
