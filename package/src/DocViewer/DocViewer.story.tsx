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

export function PdfThumbnailsBottom() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer
        src="/sample.pdf"
        pdfWorkerSrc={pdfWorkerSrc}
        defaultThumbnailsOpened
        defaultThumbnailsPosition="bottom"
        h={600}
      />
    </div>
  );
}

function LongPdf({ pages }: { pages: number }) {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer
        src={`/sample-${pages}.pdf`}
        pdfWorkerSrc={pdfWorkerSrc}
        defaultThumbnailsOpened
        h={700}
      />
    </div>
  );
}

export const Pdf50Pages = () => <LongPdf pages={50} />;
export const Pdf500Pages = () => <LongPdf pages={500} />;
export const Pdf1000Pages = () => <LongPdf pages={1000} />;

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

export function Markdown() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.md" h={600} />
    </div>
  );
}

export function Code() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.ts" h={500} />
    </div>
  );
}

export function Json() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.json" h={400} />
    </div>
  );
}

export function Text() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.log" h={300} />
    </div>
  );
}

export function TextTooLarge() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/sample.log" maxTextSize={100} h={300} />
    </div>
  );
}

export function Unsupported() {
  return (
    <div style={{ padding: 40 }}>
      <DocViewer src="/files/archive.zip" h={300} />
    </div>
  );
}
