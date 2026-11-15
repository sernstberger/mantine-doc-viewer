/**
 * A tiny PDF writer for the sample documents used by the customized Storybook stories.
 * Each story has a generator next to this file (`<name>.ts`) whose default export is a
 * `StoryPdfSource`; `npx tsx scripts/generate-story-pdfs.ts` writes them all to
 * docs/public/stories/. Coordinates are PDF points from the bottom left corner.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Standard 14 fonts, available in every PDF reader without embedding */
export const FONTS = {
  sans: 'F1',
  sansBold: 'F2',
  serif: 'F3',
  serifBold: 'F4',
  serifItalic: 'F5',
  mono: 'F6',
  monoBold: 'F7',
  sansOblique: 'F8',
} as const;

const BASE_FONTS: Record<string, string> = {
  F1: 'Helvetica',
  F2: 'Helvetica-Bold',
  F3: 'Times-Roman',
  F4: 'Times-Bold',
  F5: 'Times-Italic',
  F6: 'Courier',
  F7: 'Courier-Bold',
  F8: 'Helvetica-Oblique',
};

export type FontKey = keyof typeof FONTS;

/** RGB from 0 to 1, or a hex colour like '#1d2a44' */
export type Color = [number, number, number] | string;

export interface StoryPage {
  width: number;
  height: number;
  /** Content stream operators; build it with the helpers below */
  content: string;
  /** Links to other pages of the document (1-based), drawn as clickable areas */
  links?: { rect: [x1: number, y1: number, x2: number, y2: number]; page: number }[];
}

export interface StoryPdf {
  title: string;
  author?: string;
  subject?: string;
  pages: StoryPage[];
  /** Bookmarks shown by the viewer's outline, flat */
  outline?: { title: string; page: number }[];
}

export interface StoryPdfSource {
  /** File name in docs/public/stories, for example 'quarterly-report.pdf' */
  fileName: string;
  build: () => StoryPdf;
}

/* ------------------------------ drawing helpers ----------------------------- */

function toRgb(color: Color): string {
  if (Array.isArray(color)) {
    return color.map((value) => value.toFixed(3)).join(' ');
  }
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex;
  return [0, 2, 4]
    .map((index) => (parseInt(full.slice(index, index + 2), 16) / 255).toFixed(3))
    .join(' ');
}

/** Escapes a string for a PDF literal; keep text to Latin-1 */
export function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function fill(color: Color) {
  return `${toRgb(color)} rg`;
}

export function stroke(color: Color) {
  return `${toRgb(color)} RG`;
}

export function text(
  x: number,
  y: number,
  value: string,
  options: { size?: number; font?: FontKey; color?: Color } = {}
) {
  const { size = 11, font = 'sans', color = '#222222' } = options;
  return `${fill(color)} BT /${FONTS[font]} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
}

/** Approximate width of Helvetica text, good enough to centre or right-align short labels */
export function textWidth(value: string, size: number) {
  return value.length * size * 0.52;
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: Color; stroke?: Color; lineWidth?: number } = {}
) {
  const ops: string[] = [];
  if (options.fill) {
    ops.push(fill(options.fill));
  }
  if (options.stroke) {
    ops.push(stroke(options.stroke), `${options.lineWidth ?? 1} w`);
  }
  const paint = options.fill && options.stroke ? 'B' : options.fill ? 'f' : 'S';
  ops.push(`${x} ${y} ${width} ${height} re ${paint}`);
  return ops.join('\n');
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { color?: Color; width?: number; dash?: number[] } = {}
) {
  const { color = '#222222', width = 1, dash } = options;
  const dashOp = dash ? `[${dash.join(' ')}] 0 d` : '[] 0 d';
  return `${stroke(color)} ${width} w ${dashOp} ${x1} ${y1} m ${x2} ${y2} l S [] 0 d`;
}

/** Filled or stroked ellipse from four Bézier curves */
export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  options: { fill?: Color; stroke?: Color; lineWidth?: number } = {}
) {
  const k = 0.5523;
  const path = [
    `${cx + rx} ${cy} m`,
    `${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} c`,
    `${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} c`,
    `${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} c`,
    `${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} c`,
  ].join(' ');
  const ops: string[] = [];
  if (options.fill) {
    ops.push(fill(options.fill));
  }
  if (options.stroke) {
    ops.push(stroke(options.stroke), `${options.lineWidth ?? 1} w`);
  }
  const paint = options.fill && options.stroke ? 'B' : options.fill ? 'f' : 'S';
  return [...ops, `${path} ${paint}`].join('\n');
}

/** Lines of text wrapped to a width, top line at `y`, returns the operators and the next y */
export function paragraph(
  x: number,
  y: number,
  value: string,
  options: { size?: number; font?: FontKey; color?: Color; width: number; leading?: number }
) {
  const { size = 11, width, leading = size * 1.45 } = options;
  const maxChars = Math.max(10, Math.floor(width / (size * 0.5)));
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) {
    lines.push(current);
  }
  const ops = lines.map((lineText, index) => text(x, y - index * leading, lineText, options));
  return { ops: ops.join('\n'), y: y - lines.length * leading };
}

/** Saves graphics state, applies an opacity-free transform, runs `ops`, restores */
export function group(ops: string[], transform?: [number, number, number, number, number, number]) {
  return ['q', transform ? `${transform.join(' ')} cm` : '', ...ops, 'Q']
    .filter(Boolean)
    .join('\n');
}

/* --------------------------------- writer --------------------------------- */

export function serializePdf(pdf: StoryPdf): string {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body) && objects.length;

  const catalog = add('');
  const pagesId = add('');
  const fontIds = Object.entries(BASE_FONTS).map(
    ([key, name]) =>
      [
        key,
        add(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`),
      ] as const
  );
  const fontResources = fontIds.map(([key, id]) => `/${key} ${id} 0 R`).join(' ');

  const total = pdf.pages.length;
  const firstPageId = objects.length + 1;
  const firstContentId = firstPageId + total;
  let nextLinkId = firstContentId + total;
  const pageIds = pdf.pages.map((_, index) => firstPageId + index);

  const linkBodies: string[] = [];
  pdf.pages.forEach((page, index) => {
    const linkIds = (page.links ?? []).map((link) => {
      linkBodies.push(
        `<< /Type /Annot /Subtype /Link /Rect [${link.rect.join(' ')}] /Border [0 0 0] /Dest [${pageIds[link.page - 1]} 0 R /XYZ 0 ${pdf.pages[link.page - 1].height} null] >>`
      );
      nextLinkId += 1;
      return nextLinkId - 1;
    });
    const annots = linkIds.length ? ` /Annots [${linkIds.map((id) => `${id} 0 R`).join(' ')}]` : '';
    add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${firstContentId + index} 0 R /Resources << /Font << ${fontResources} >> >>${annots} >>`
    );
  });

  pdf.pages.forEach((page) => {
    const stream = Buffer.from(page.content, 'latin1');
    add(`<< /Length ${stream.length} >>\nstream\n${page.content}\nendstream`);
  });
  linkBodies.forEach((body) => add(body));

  let outlines = '';
  if (pdf.outline?.length) {
    const root = add('');
    const ids = pdf.outline.map((_, index) => objects.length + index + 1);
    pdf.outline.forEach((item, index) => {
      const siblings = [
        index > 0 ? `/Prev ${ids[index - 1]} 0 R` : '',
        index < ids.length - 1 ? `/Next ${ids[index + 1]} 0 R` : '',
      ].join(' ');
      add(
        `<< /Title (${escapePdfText(item.title)}) /Parent ${root} 0 R ${siblings} /Dest [${pageIds[item.page - 1]} 0 R /Fit] >>`
      );
    });
    objects[root - 1] =
      `<< /Type /Outlines /First ${ids[0]} 0 R /Last ${ids[ids.length - 1]} 0 R /Count ${ids.length} >>`;
    outlines = ` /Outlines ${root} 0 R`;
  }

  const info = add(
    `<< /Title (${escapePdfText(pdf.title)})${pdf.author ? ` /Author (${escapePdfText(pdf.author)})` : ''}${pdf.subject ? ` /Subject (${escapePdfText(pdf.subject)})` : ''} /Producer (mantine-doc-viewer stories) >>`
  );

  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R${outlines} >>`;
  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${total} >>`;

  let output = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = Buffer.byteLength(output, 'latin1');
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xrefOffset = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return output;
}

export const STORY_PDF_DIR = path.join(process.cwd(), 'docs/public/stories');

export function writeStoryPdf(source: StoryPdfSource) {
  fs.mkdirSync(STORY_PDF_DIR, { recursive: true });
  const outputPath = path.join(STORY_PDF_DIR, source.fileName);
  fs.writeFileSync(outputPath, serializePdf(source.build()), 'latin1');
  return outputPath;
}
