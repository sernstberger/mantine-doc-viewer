/**
 * Writes docs/public/sample.pdf, a small multi-page PDF used by Storybook and the docs demos,
 * and sample-50.pdf, sample-500.pdf and sample-1000.pdf for checking long documents.
 * Run with `npx tsx scripts/generate-sample-pdf.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import signale from 'signale';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const COLORS = ['0.13 0.55 0.9', '0.75 0.29 0.86', '0.07 0.72 0.53'];

/** Table of contents drawn on page 1, each entry a link to its chapter */
interface TocEntry {
  title: string;
  page: number;
}

const TOC_TOP = 500;
const TOC_LINE = 22;

function tocContent(toc: TocEntry[]) {
  return [
    '0.2 0.2 0.2 rg',
    `BT /F2 14 Tf 72 ${TOC_TOP + 28} Td (Contents) Tj ET`,
    ...toc.map(
      (entry, index) =>
        `0.1 0.35 0.8 rg BT /F1 12 Tf 72 ${TOC_TOP - index * TOC_LINE} Td (${entry.title} ...... page ${entry.page}) Tj ET`
    ),
    `0.1 0.35 0.8 rg BT /F1 12 Tf 72 ${TOC_TOP - toc.length * TOC_LINE - 10} Td (mantine.dev) Tj ET`,
  ].join('\n');
}

function pageContent(pageNumber: number, total: number, toc: TocEntry[] = []) {
  if (pageNumber === 1 && toc.length > 0) {
    const color = COLORS[0];
    return [
      `${color} rg 0 ${PAGE_HEIGHT - 160} ${PAGE_WIDTH} 160 re f`,
      '1 1 1 rg',
      `BT /F2 36 Tf 72 ${PAGE_HEIGHT - 100} Td (mantine-doc-viewer) Tj ET`,
      `BT /F1 16 Tf 72 ${PAGE_HEIGHT - 132} Td (Sample document, page 1 of ${total}) Tj ET`,
      tocContent(toc),
      `0.6 0.6 0.6 rg BT /F1 10 Tf ${PAGE_WIDTH / 2 - 20} 40 Td (Page 1) Tj ET`,
      // Two layers (optional content): a watermark that is shown and reviewer notes that are hidden
      '/OC /L1 BDC 0.9 0.3 0.3 rg BT /F2 72 Tf 150 220 Td (DRAFT) Tj ET EMC',
      '/OC /L2 BDC 0.85 0.45 0.05 rg BT /F1 12 Tf 72 150 Td (Reviewer note: check the figures in chapter 3.) Tj ET EMC',
    ].join('\n');
  }

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

/** Writes a PDF; `chapterLength` adds an outline (bookmarks) with a chapter every that many pages */
function buildPdf(totalPages: number, chapterLength = 0) {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body) && objects.length;

  const catalog = add('');
  const pages = add('');
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [];

  // The feature sample (with chapters) also has layers, an attachment and document properties
  const extras = chapterLength > 0;
  const draftLayer = extras ? add('<< /Type /OCG /Name (Draft watermark) >>') : 0;
  const notesLayer = extras ? add('<< /Type /OCG /Name (Reviewer notes) >>') : 0;

  // Page dictionaries first and content streams after them, as many PDF writers do. pdf.js reads
  // every page dictionary when a document opens, so grouping them keeps that to the start of the
  // file and lets range requests skip the content of pages that are not shown
  const firstContentId = objects.length + totalPages + 1;
  // Link annotations on page 1 are written after the pages, so their ids are known up front
  const toc: TocEntry[] =
    chapterLength > 0
      ? Array.from({ length: Math.ceil(totalPages / chapterLength) }, (_, index) => ({
          title: `Chapter ${index + 1}`,
          page: index * chapterLength + 1,
        }))
      : [];
  const firstLinkId = firstContentId + totalPages;
  const linkIds =
    toc.length > 0 ? Array.from({ length: toc.length + 1 }, (_, index) => firstLinkId + index) : [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const content = firstContentId + pageNumber - 1;
    const annots =
      pageNumber === 1 && linkIds.length > 0
        ? ` /Annots [${linkIds.map((id) => `${id} 0 R`).join(' ')}]`
        : '';
    const properties =
      pageNumber === 1 && extras
        ? ` /Properties << /L1 ${draftLayer} 0 R /L2 ${notesLayer} 0 R >>`
        : '';
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${content} 0 R /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >>${properties} >>${annots} >>`
      )
    );
  }

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const stream = pageContent(pageNumber, totalPages, toc);
    add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }

  // Each contents entry links to the top of its chapter's page, the last one is a web link
  toc.forEach((entry, index) => {
    const y = TOC_TOP - index * TOC_LINE;
    add(
      `<< /Type /Annot /Subtype /Link /Rect [68 ${y - 5} 300 ${y + 14}] /Border [0 0 0] /Dest [${pageIds[entry.page - 1]} 0 R /XYZ 0 ${PAGE_HEIGHT} null] >>`
    );
  });
  if (toc.length > 0) {
    const y = TOC_TOP - toc.length * TOC_LINE - 10;
    add(
      `<< /Type /Annot /Subtype /Link /Rect [68 ${y - 5} 160 ${y + 14}] /Border [0 0 0] /A << /S /URI /URI (https://mantine.dev) >> >>`
    );
  }

  let outlines = '';
  if (chapterLength > 0) {
    const root = add('');
    const chapters = Array.from(
      { length: Math.ceil(totalPages / chapterLength) },
      (_, index) => index * chapterLength
    );
    const itemIds = chapters.map((_, index) => objects.length + index + 1);
    chapters.forEach((firstPage, index) => {
      const links = [
        index > 0 ? `/Prev ${itemIds[index - 1]} 0 R` : '',
        index < chapters.length - 1 ? `/Next ${itemIds[index + 1]} 0 R` : '',
      ].join(' ');
      const title = `Chapter ${index + 1}: pages ${firstPage + 1}-${Math.min(firstPage + chapterLength, totalPages)}`;
      add(
        `<< /Title (${title}) /Parent ${root} 0 R ${links} /Dest [${pageIds[firstPage]} 0 R /Fit] >>`
      );
    });
    objects[root - 1] =
      `<< /Type /Outlines /First ${itemIds[0]} 0 R /Last ${itemIds[itemIds.length - 1]} 0 R /Count ${itemIds.length} >>`;
    outlines = ` /Outlines ${root} 0 R`;
  }

  let catalogExtras = '';
  let info = 0;
  if (extras) {
    const note = 'Notes attached to the sample document.\n';
    const file = add(
      `<< /Type /EmbeddedFile /Subtype /text#2Fplain /Length ${Buffer.byteLength(note)} >>\nstream\n${note}\nendstream`
    );
    const fileSpec = add(
      `<< /Type /Filespec /F (notes.txt) /UF (notes.txt) /Desc (Reviewer notes) /EF << /F ${file} 0 R >> >>`
    );
    info = add(
      '<< /Title (mantine-doc-viewer sample) /Author (Mantine Doc Viewer) /Subject (Sample document with outline, links, layers and an attachment) /Keywords (sample, pdf) /Creator (generate-sample-pdf.ts) /Producer (mantine-doc-viewer) /CreationDate (D:20260101120000Z) /ModDate (D:20260102093000Z) >>'
    );
    catalogExtras =
      ` /OCProperties << /OCGs [${draftLayer} 0 R ${notesLayer} 0 R] /D << /Order [${draftLayer} 0 R ${notesLayer} 0 R] /OFF [${notesLayer} 0 R] >> >>` +
      ` /Names << /EmbeddedFiles << /Names [(notes.txt) ${fileSpec} 0 R] >> >>`;
  }

  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R${outlines}${catalogExtras} >>`;
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
  const infoEntry = info ? ` /Info ${info} 0 R` : '';
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R${infoEntry} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return output;
}

const SAMPLES: [fileName: string, pages: number, chapterLength?: number][] = [
  ['sample.pdf', 3],
  ['sample-50.pdf', 50, 10],
  ['sample-500.pdf', 500],
  ['sample-1000.pdf', 1000],
];

SAMPLES.forEach(([fileName, pages, chapterLength]) => {
  const outputPath = path.join(process.cwd(), 'docs/public', fileName);
  fs.writeFileSync(outputPath, buildPdf(pages, chapterLength));
  signale.success(`Wrote ${outputPath}`);
});
