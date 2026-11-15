import { degrees, PDFDocument } from 'pdf-lib';
import { applyPageRotations } from './rotate-pages';

async function makePdf(rotations: number[]) {
  const document = await PDFDocument.create();
  rotations.forEach((angle) => document.addPage([612, 792]).setRotation(degrees(angle)));
  return document.save();
}

async function rotationsOf(bytes: Uint8Array) {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => page.getRotation().angle);
}

describe('applyPageRotations', () => {
  it('turns pages on top of the rotation they already have', async () => {
    const bytes = await makePdf([0, 90, 0]);
    const turned = await applyPageRotations(bytes, [90, 270, 0]);
    expect(await rotationsOf(turned)).toEqual([90, 0, 0]);
  });

  it('leaves the bytes alone when no page turns', async () => {
    const bytes = await makePdf([0, 0]);
    expect(await applyPageRotations(bytes, [0, 0])).toBe(bytes);
  });
});
