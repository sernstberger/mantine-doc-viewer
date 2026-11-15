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

      // Counted while reading, as the size may be missing or be the compressed size
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = response.body?.getReader();

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          size += value.byteLength;
          if (size > maxSize) {
            controller.abort();
            return { status: 'too-large', size } as const;
          }
          chunks.push(value);
        }
      } else {
        const buffer = new Uint8Array(await response.arrayBuffer());
        size = buffer.byteLength;
        if (size > maxSize) {
          return { status: 'too-large', size } as const;
        }
        chunks.push(buffer);
      }

      const bytes = new Uint8Array(size);
      let offset = 0;
      chunks.forEach((chunk) => {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      });

      return {
        status: 'ready',
        text: decodeText(bytes, response.headers.get('content-type')),
      } as const;
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

/** Decodes with the charset the server names, UTF-8 when it names none or one the browser does not know */
export function decodeText(bytes: Uint8Array, contentType: string | null) {
  const charset = contentType?.match(/charset=["']?([^;"'\s]+)/i)?.[1];

  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
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
