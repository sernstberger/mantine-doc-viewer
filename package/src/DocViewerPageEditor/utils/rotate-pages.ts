import { importPdfLib } from './import-pdf-lib';

/**
 * Turns pages of a PDF by writing their `/Rotate`, which pdf.js cannot do: `turns[i]` is how far
 * page `i` turns clockwise, in degrees (0, 90, 180 or 270), on top of any rotation it already has.
 * pdf-lib is only loaded when a page turns
 */
export async function applyPageRotations(bytes: Uint8Array, turns: number[]): Promise<Uint8Array> {
  if (!turns.some(Boolean)) {
    return bytes;
  }
  const { PDFDocument, degrees } = await importPdfLib();
  const document = await PDFDocument.load(bytes);
  document.getPages().forEach((page, index) => {
    const turn = turns[index];
    if (turn) {
      page.setRotation(degrees((page.getRotation().angle + turn) % 360));
    }
  });
  return document.save();
}
