import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React from 'react';
import { DocViewer } from './DocViewer';

export default { title: 'DocViewer' };

export function Pdf() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" pdfWorkerSrc={pdfWorkerSrc} h={600} />
    </div>
  );
}

export function PdfWithThumbnails() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" pdfWorkerSrc={pdfWorkerSrc} defaultThumbnailsOpened h={600} />
    </div>
  );
}

export function PdfWithoutWorker() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.pdf" h={300} />
    </div>
  );
}

export function PdfLoadError() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/missing.pdf" pdfWorkerSrc={pdfWorkerSrc} h={300} />
    </div>
  );
}

export function Image() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-image.svg" h={500} />
    </div>
  );
}

export function ImageSmall() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample-image.svg" w={360} h={280} />
    </div>
  );
}

export function ImageLoadError() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/missing.png" h={300} />
    </div>
  );
}

export function Unsupported() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/files/notes.md" h={300} />
    </div>
  );
}
