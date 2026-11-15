import { useEffect, useState } from 'react';

export type TextDocumentState =
  | { status: 'loading' }
  | { status: 'ready'; text: string }
  | { status: 'too-large'; size: number }
  | { status: 'error'; error: Error };

/** Loads a text file, refusing files larger than `maxSize` bytes before reading them when the server says how large they are */
export function useTextDocument(src: string, maxSize: number): TextDocumentState {
  const [state, setState] = useState<TextDocumentState>({ status: 'loading' });

  useEffect(() => {
    // Aborting also stops the download of a file that turns out to be too large,
    // so whether the component is still interested is tracked separately
    const controller = new AbortController();
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const declaredSize = Number(response.headers.get('content-length'));
      if (declaredSize > maxSize) {
        controller.abort();
        return { status: 'too-large', size: declaredSize } as const;
      }

      const blob = await response.blob();
      if (blob.size > maxSize) {
        return { status: 'too-large', size: blob.size } as const;
      }

      return { status: 'ready', text: await blob.text() } as const;
    })()
      .then((next) => !cancelled && setState(next))
      .catch((error: Error) => !cancelled && setState({ status: 'error', error }));

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src, maxSize]);

  return state;
}

export function formatFileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`;
}
