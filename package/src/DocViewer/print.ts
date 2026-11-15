/**
 * Prints from a hidden iframe, so only the document is printed and not the page around the
 * viewer. The iframe is removed once the print dialog closes
 */
function printFrame(setup: (frame: HTMLIFrameElement) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    Object.assign(frame.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    });

    const remove = () => {
      // Some browsers return from print() before the dialog closes, so remove a little later
      window.setTimeout(() => frame.remove(), 60_000);
    };

    frame.onload = () => {
      try {
        const view = frame.contentWindow;
        if (!view) {
          throw new Error('Print frame has no window');
        }
        view.addEventListener('afterprint', () => frame.remove(), { once: true });
        view.focus();
        view.print();
        remove();
        resolve();
      } catch (error) {
        frame.remove();
        reject(error);
      }
    };

    setup(frame);
    document.body.append(frame);
  });
}

/** Prints a PDF from its bytes with the browser's own PDF viewer */
export async function printPdfBytes(bytes: Uint8Array) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  try {
    await printFrame((frame) => {
      frame.src = url;
    });
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Prints HTML, for example an image or rendered markdown, with minimal print styles */
export function printHtml(body: string, title = '') {
  return printFrame((frame) => {
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      body { margin: 0; font: 12pt/1.5 system-ui, sans-serif; color: #000; }
      img { display: block; max-width: 100%; max-height: 100vh; margin: auto; object-fit: contain; }
      pre { white-space: pre-wrap; word-break: break-word; font: 10pt/1.45 ui-monospace, monospace; }
      table { border-collapse: collapse; } th, td { border: 1px solid #999; padding: 4px 8px; }
    </style></head><body>${body}</body></html>`;
  });
}

export function printImage(src: string, alt: string, title?: string) {
  return printHtml(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`, title);
}

export function printText(text: string, title?: string) {
  return printHtml(`<pre>${escapeHtml(text)}</pre>`, title);
}
