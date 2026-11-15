import {
  createMarkId,
  getMarkLines,
  getTextRect,
  rectFromPoints,
  saveMarkedDocument,
  serializeMark,
  toPagePoint,
  toPathData,
} from './markup';

// Page space has its origin at the bottom left of a 792pt high page
const viewport = { convertToPdfPoint: (x: number, y: number) => [x, 792 - y] };

describe('markup geometry', () => {
  it('sizes text boxes for their longest line, and never zero wide', () => {
    expect(getTextRect({ x: 10, y: 20, text: 'ab\nabcd', fontSize: 10 })).toEqual({
      x: 10,
      y: 20,
      width: 4 * 10 * 0.56,
      height: 2 * 10 * 1.2,
    });
    expect(getTextRect({ x: 0, y: 0, text: '', fontSize: 10 }).width).toBeCloseTo(5.6);
  });

  it('makes a box from a drag in any direction', () => {
    expect(rectFromPoints([30, 40], [10, 5])).toEqual({ x: 10, y: 5, width: 20, height: 35 });
  });

  it('outlines rectangles, ellipses and clouds, closed', () => {
    const rect = { x: 0, y: 0, width: 28, height: 14 };
    const base = { id: 'a', page: 1, color: '#000', width: 1 };

    expect(getMarkLines({ ...base, type: 'rectangle', rect })).toEqual([
      [
        [0, 0],
        [28, 0],
        [28, 14],
        [0, 14],
        [0, 0],
      ],
    ]);

    const [ellipse] = getMarkLines({ ...base, type: 'ellipse', rect });
    expect(ellipse[0]).toEqual([28, 7]);
    expect(ellipse[ellipse.length - 1][0]).toBeCloseTo(28);

    // 2 scallops along each long side, 1 along each short side, 8 points each
    const [cloud] = getMarkLines({ ...base, type: 'cloud', rect });
    expect(cloud).toHaveLength(6 * 8 + 1);
    expect(cloud[cloud.length - 1]).toEqual(cloud[0]);
    // Scallops bulge outwards: above the top side
    expect(Math.min(...cloud.map(([, y]) => y))).toBeLessThan(0);

    // A cloud with no size still has an outline
    const [dot] = getMarkLines({
      ...base,
      type: 'cloud',
      rect: { x: 5, y: 5, width: 0, height: 0 },
    });
    expect(dot.every(([x, y]) => x === 5 && y === 5)).toBe(true);
  });

  it('draws the strokes of pen marks as they are', () => {
    const strokes: [number, number][][] = [[[1, 2]], [[3, 4]]];
    expect(getMarkLines({ type: 'pen', id: 'a', page: 1, color: '#000', width: 1, strokes })).toBe(
      strokes
    );
  });

  it('makes SVG paths at a scale, with a dot for a single point', () => {
    expect(
      toPathData(
        [
          [
            [1, 2],
            [3, 4.005],
          ],
          [[5, 6]],
        ],
        2
      )
    ).toBe('M2 4L6 8.01M10 12h0');
  });

  it.each([
    [0, [10, 20]],
    [90, [20, 200 * 2 - 10]],
    [180, [100 * 2 - 10, 200 * 2 - 20]],
    [270, [100 * 2 - 20, 10]],
  ] as const)('finds the page point under the pointer at %i degrees', (rotation, [x, y]) => {
    expect(toPagePoint(10, 20, 100, 200, 2, rotation)).toEqual([x / 2, y / 2]);
  });

  it('gives every mark its own id', () => {
    expect(createMarkId()).not.toBe(createMarkId());
  });
});

describe('serializeMark', () => {
  const base = { id: 'a', page: 2, color: '#ff0000' };

  it('writes a highlight with quad points in PDF space', () => {
    expect(
      serializeMark(
        { ...base, type: 'highlight', rect: { x: 10, y: 92, width: 100, height: 20 } },
        viewport,
        0
      )
    ).toEqual({
      annotationType: 9,
      pageIndex: 1,
      color: [255, 0, 0],
      rotation: 0,
      opacity: 1,
      rect: [10, 680, 110, 700],
      quadPoints: [10, 700, 110, 700, 10, 680, 110, 680],
      outlines: [[10, 680, 10, 700, 110, 700, 110, 680]],
    });
  });

  it('writes text as free text, turned with the page', () => {
    expect(
      serializeMark({ ...base, type: 'text', x: 10, y: 92, text: 'Hi', fontSize: 10 }, viewport, 90)
    ).toEqual({
      annotationType: 3,
      pageIndex: 1,
      color: [255, 0, 0],
      rotation: 90,
      fontSize: 10,
      value: 'Hi',
      rect: [10, 688, expect.closeTo(21.2), 700],
    });
  });

  it('writes pen marks and shapes as ink, padded by the line width', () => {
    const ink = serializeMark(
      {
        ...base,
        type: 'pen',
        width: 2,
        strokes: [
          [
            [0, 92],
            [10, 102],
          ],
        ],
      },
      viewport,
      0
    );
    expect(ink).toEqual({
      annotationType: 15,
      pageIndex: 1,
      color: [255, 0, 0],
      rotation: 0,
      opacity: 1,
      thickness: 2,
      rect: [-1, 689, 11, 701],
      paths: {
        lines: [[NaN, NaN, NaN, NaN, 0, 700, NaN, NaN, NaN, NaN, 10, 690]],
        points: [[0, 700, 10, 690]],
      },
    });

    const shape = serializeMark(
      { ...base, type: 'rectangle', width: 1, rect: { x: 0, y: 0, width: 10, height: 10 } },
      viewport,
      0
    ) as { paths: { points: number[][] } };
    expect(shape.paths.points[0]).toEqual([0, 792, 10, 792, 10, 782, 0, 782, 0, 792]);
  });

  it('writes signatures as pdf.js drawn signatures', () => {
    expect(
      serializeMark({ ...base, type: 'signature', width: 1, strokes: [[[0, 92]]] }, viewport, 0)
    ).toEqual({
      annotationType: 101,
      pageIndex: 1,
      color: [255, 0, 0],
      rotation: 0,
      isSignature: true,
      areContours: false,
      thickness: 1,
      lines: [[NaN, NaN, NaN, NaN, 0, 700]],
      rect: [-0.5, 699.5, 0.5, 700.5],
    });
  });
});

describe('saveMarkedDocument', () => {
  function fakeDocument(saveDocument: () => Promise<Uint8Array>) {
    const values = new Map<string, unknown>();
    const page = { rotate: 0, getViewport: () => viewport };
    return {
      values,
      document: {
        annotationStorage: {
          setValue: (key: string, value: unknown) => values.set(key, value),
          remove: (key: string) => values.delete(key),
        },
        getPage: () => Promise.resolve(page),
        saveDocument,
      } as any,
    };
  }

  it('adds the marks to the annotation storage while saving, then takes them out', async () => {
    let stored: string[] = [];
    const { document, values } = fakeDocument(() => {
      stored = [...values.keys()];
      return Promise.resolve(new Uint8Array([1]));
    });
    const mark = {
      type: 'highlight' as const,
      id: 'a',
      page: 1,
      color: '#ff0',
      rect: { x: 0, y: 0, width: 5, height: 5 },
    };

    await expect(saveMarkedDocument(document, [mark, { ...mark, id: 'b' }])).resolves.toEqual(
      new Uint8Array([1])
    );
    expect(stored).toEqual([
      'pdfjs_internal_editor_docviewer_0',
      'pdfjs_internal_editor_docviewer_1',
    ]);
    expect(values.size).toBe(0);
  });

  it('leaves the storage as it was when saving fails', async () => {
    const { document, values } = fakeDocument(() => Promise.reject(new Error('Worker gone')));
    await expect(
      saveMarkedDocument(document, [
        { type: 'text', id: 'a', page: 1, color: '#000', x: 0, y: 0, text: 'x', fontSize: 9 },
      ])
    ).rejects.toThrow('Worker gone');
    expect(values.size).toBe(0);
  });
});
