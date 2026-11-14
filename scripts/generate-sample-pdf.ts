/**
 * Writes docs/public/sample.pdf, a small multi-page PDF used by Storybook and the docs demos.
 * Run with `npx tsx scripts/generate-sample-pdf.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import signale from 'signale';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const COLORS = ['0.13 0.55 0.9', '0.75 0.29 0.86', '0.07 0.72 0.53'];

function pageContent(pageNumber: number, total: number) {
  const color = COLORS[(pageNumber - 1) % COLORS.length];
  const lines = Array.from(
    { length: 18 },
    (_, index) =>
      `BT /F1 11 Tf 72 ${560 - index * 22} Td (Line ${index + 1} of sample text on page ${pageNumber}.) Tj ET`
  );

  return [
    `${color} rg 0 ${PAGE_HEIGHT - 160} ${PAGE_WIDTH} 160 re f`,
    '1 1 1 rg',
    `BT /F2 36 Tf 72 ${PAGE_HEIGHT - 100} Td (mantine-doc-viewer) Tj ET`,
    `BT /F1 16 Tf 72 ${PAGE_HEIGHT - 132} Td (Sample document, page ${pageNumber} of ${total}) Tj ET`,
    '0.2 0.2 0.2 rg',
    ...lines,
    `0.6 0.6 0.6 rg BT /F1 10 Tf ${PAGE_WIDTH / 2 - 20} 40 Td (Page ${pageNumber}) Tj ET`,
  ].join('\n');
}

function buildPdf(totalPages: number) {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body) && objects.length;

  const catalog = add('');
  const pages = add('');
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const stream = pageContent(pageNumber, totalPages);
    const content = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${content} 0 R /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> >>`
      )
    );
  }

  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`;
  objects[pages - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${totalPages} >>`;

  let output = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = Buffer.byteLength(output);
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });

  const xrefOffset = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return output;
}

const outputPath = path.join(process.cwd(), 'docs/public/sample.pdf');
fs.writeFileSync(outputPath, buildPdf(3));
signale.success(`Wrote ${outputPath}`);
