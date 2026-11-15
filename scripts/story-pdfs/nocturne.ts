/**
 * "Nocturne in D-flat, Lantern Hour" by the fictional Iris Calloway: a six page piano score for
 * the Stand (sheet music reader) story. Grand staff systems with a brace, clefs, a five flat key
 * signature, 6/8 time, beamed eighths, open and filled note heads, slurs and dynamics.
 */
import { ellipse, line, rect, StoryPage, StoryPdfSource, stroke, fill, text } from './pdf-writer';

const W = 612;
const H = 792;
const INK = '#1b1815';
const S = 5.1; // staff space in points
const LEFT = 56;
const RIGHT = W - 50;
const SYSTEM_PITCH = 128;
const TREBLE_TO_BASS = 9 * S;
const MEASURES_PER_SYSTEM = 4;
const PAGE_SYSTEMS = [4, 5, 5, 5, 5, 5];

/* ----------------------------------- random ----------------------------------- */

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------- primitives --------------------------------- */

const num = (value: number) => value.toFixed(2);

function poly(points: [number, number][], color: string) {
  const [first, ...rest] = points;
  return `${fill(color)} ${num(first[0])} ${num(first[1])} m ${rest
    .map(([x, y]) => `${num(x)} ${num(y)} l`)
    .join(' ')} f`;
}

function curve(
  points: [number, number][],
  options: { width?: number; color?: string; cap?: number } = {}
) {
  const { width = 0.8, color = INK, cap = 1 } = options;
  const [start] = points;
  const ops = [`${stroke(color)} ${width} w ${cap} J ${num(start[0])} ${num(start[1])} m`];
  for (let index = 0; index + 2 < points.length; index += 3) {
    const [a, b, c] = [points[index + 1], points[index + 2], points[index + 3]];
    ops.push(`${num(a[0])} ${num(a[1])} ${num(b[0])} ${num(b[1])} ${num(c[0])} ${num(c[1])} c`);
  }
  return `${ops.join(' ')} S`;
}

/** A note head: a tilted ellipse, filled or open */
function head(x: number, y: number, open: boolean) {
  const matrix = `0.94 0.342 -0.342 0.94 ${num(x)} ${num(y)} cm`;
  return open
    ? `q ${matrix} ${ellipse(0, 0, S * 0.62, S * 0.42, { stroke: INK, lineWidth: 1.15 })} Q`
    : `q ${matrix} ${ellipse(0, 0, S * 0.62, S * 0.45, { fill: INK })} Q`;
}

function flat(x: number, y: number) {
  return [
    line(x, y - S * 0.55, x, y + S * 1.75, { color: INK, width: 0.7 }),
    curve(
      [
        [x, y - S * 0.55],
        [x + S * 1.15, y + S * 0.15],
        [x + S * 0.95, y + S * 1.05],
        [x, y + S * 0.35],
      ],
      { width: 0.9 }
    ),
  ].join('\n');
}

/** Treble clef from curves, drawn around the G line */
function trebleClef(x: number, bottom: number) {
  const g = bottom + 2 * S;
  const p = (ux: number, uy: number): [number, number] => [x + ux * S, g + uy * S];
  return [
    curve(
      [
        p(0.2, -1.2),
        p(1.5, 0.0),
        p(1.7, 1.6),
        p(0.9, 2.0),
        p(0.1, 2.6),
        p(-1.0, 1.4),
        p(-0.9, 0.2),
        p(-0.8, -1.0),
        p(0.5, -1.4),
        p(1.0, -0.4),
        p(1.4, 0.7),
        p(0.3, 1.3),
        p(-0.2, 0.9),
        p(-0.4, 0.5),
        p(0.0, 0.1),
        p(0.4, 0.3),
      ],
      { width: 1.15 }
    ),
    curve(
      [
        p(0.2, -1.2),
        p(0.0, 1.5),
        p(-0.1, 4.2),
        p(0.35, 5.3),
        p(0.9, 6.4),
        p(0.5, 7.2),
        p(0.15, 6.9),
      ],
      { width: 1.15 }
    ),
    curve([p(0.15, 6.9), p(-0.5, 6.4), p(-0.6, 5.4), p(-0.1, 4.6)], { width: 1.15 }),
    curve([p(0.2, -1.2), p(0.2, -2.0), p(-0.3, -2.9), p(-0.9, -2.5)], { width: 1.15 }),
    ellipse(x - 0.5 * S + 0.6 * S, g - 2.5 * S - 0.05 * S, 0.35 * S, 0.35 * S, { fill: INK }),
  ].join('\n');
}

function bassClef(x: number, bottom: number) {
  const f = bottom + 6 * S;
  const p = (ux: number, uy: number): [number, number] => [x + ux * S, f + uy * S];
  return [
    ellipse(x + 0.2 * S, f + 0.05 * S, 0.55 * S, 0.5 * S, { fill: INK }),
    curve(
      [
        p(-0.3, 0.2),
        p(0.2, 1.2),
        p(1.9, 1.0),
        p(2.0, -0.4),
        p(2.0, -2.2),
        p(0.7, -3.6),
        p(-0.9, -4.4),
      ],
      {
        width: 1.5,
      }
    ),
    ellipse(x + 3.0 * S, f + 0.65 * S, 0.3 * S, 0.3 * S, { fill: INK }),
    ellipse(x + 3.0 * S, f - 0.65 * S, 0.3 * S, 0.3 * S, { fill: INK }),
  ].join('\n');
}

function brace(x: number, top: number, bottom: number) {
  const mid = (top + bottom) / 2;
  const w = 10;
  return [
    `${fill(INK)} ${num(x)} ${num(top)} m`,
    `${num(x - w)} ${num(top - 14)} ${num(x + 2)} ${num(mid + 30)} ${num(x - w)} ${num(mid)} c`,
    `${num(x + 2)} ${num(mid - 30)} ${num(x - w)} ${num(bottom + 14)} ${num(x)} ${num(bottom)} c`,
    `${num(x - w + 4)} ${num(bottom + 14)} ${num(x - 6)} ${num(mid - 30)} ${num(x - w + 4)} ${num(mid)} c`,
    `${num(x - 6)} ${num(mid + 30)} ${num(x - w + 4)} ${num(top - 14)} ${num(x)} ${num(top)} c f`,
  ].join(' ');
}

/* ----------------------------------- notation ----------------------------------- */

interface Note {
  x: number;
  step: number;
  /** length in eighths */
  length: number;
  /** which dotted quarter of the 6/8 bar the note starts in */
  beat: number;
}

function stepY(bottom: number, step: number) {
  return bottom + (step * S) / 2;
}

function ledgers(x: number, bottom: number, step: number) {
  const ops: string[] = [];
  const draw = (lineStep: number) =>
    ops.push(
      line(x - S * 1.0, stepY(bottom, lineStep), x + S * 1.0, stepY(bottom, lineStep), {
        color: INK,
        width: 0.7,
      })
    );
  for (let l = -2; l >= step - (step % 2 === 0 ? 0 : -1); l -= 2) {
    draw(l);
  }
  for (let l = 10; l <= step - (step % 2 === 0 ? 0 : 1); l += 2) {
    draw(l);
  }
  return ops;
}

/** Draws notes of one staff for a measure, grouping eighths into beams per dotted quarter */
function drawNotes(notes: Note[], bottom: number): string[] {
  const ops: string[] = [];
  const groups: Note[][] = [];
  notes.forEach((note) => {
    const last = groups[groups.length - 1];
    if (note.length === 1 && last && last[0].length === 1 && last[0].beat === note.beat) {
      last.push(note);
    } else {
      groups.push([note]);
    }
  });
  groups.forEach((group) => {
    const average = group.reduce((sum, n) => sum + n.step, 0) / group.length;
    const up = average < 4;
    group.forEach((note) => {
      const y = stepY(bottom, note.step);
      ops.push(...ledgers(note.x, bottom, note.step));
      ops.push(head(note.x, y, note.length >= 4));
      if (note.length === 3 || note.length === 6) {
        ops.push(
          ellipse(note.x + S * 1.15, y + (note.step % 2 === 0 ? S * 0.5 : 0), S * 0.2, S * 0.2, {
            fill: INK,
          })
        );
      }
    });
    if (group[0].length === 6) {
      return;
    }
    const stemLength = 3.4 * S;
    const side = up ? S * 0.6 : -S * 0.6;
    const tips = group.map((n) => {
      const y = stepY(bottom, n.step);
      return up ? y + stemLength : y - stemLength;
    });
    if (group.length === 1) {
      const [note] = group;
      const y = stepY(bottom, note.step);
      const tip = tips[0];
      ops.push(line(note.x + side, y, note.x + side, tip, { color: INK, width: 0.75 }));
      if (note.length === 1) {
        const sign = up ? -1 : 1;
        ops.push(
          curve(
            [
              [note.x + side, tip],
              [note.x + side + S * 0.2, tip + sign * S * 0.9],
              [note.x + side + S * 1.5, tip + sign * S * 1.4],
              [note.x + side + S * 1.1, tip + sign * S * 3.0],
            ],
            { width: 1.1 }
          )
        );
      }
      return;
    }
    // Beam: a straight line between the outer stems, lifted until every stem is long enough
    const first = group[0];
    const lastNote = group[group.length - 1];
    const slope = Math.max(-S * 1.2, Math.min(S * 1.2, (tips[tips.length - 1] - tips[0]) * 0.5));
    const lineAt = (x: number, base: number) =>
      base + (slope * (x - first.x)) / Math.max(1, lastNote.x - first.x);
    let base = tips[0];
    group.forEach((note, index) => {
      const need = tips[index];
      const at = lineAt(note.x, base);
      base += up ? Math.max(0, need - at) : Math.min(0, need - at);
    });
    const thick = S * 0.5;
    const x1 = first.x + side;
    const x2 = lastNote.x + side;
    group.forEach((note) => {
      const y = stepY(bottom, note.step);
      const x = note.x + side;
      ops.push(line(x, y, x, lineAt(note.x, base), { color: INK, width: 0.75 }));
    });
    const y1 = lineAt(first.x, base);
    const y2 = lineAt(lastNote.x, base);
    const drop = up ? -thick : thick;
    ops.push(
      poly(
        [
          [x1 - 0.4, y1],
          [x2 + 0.4, y2],
          [x2 + 0.4, y2 + drop],
          [x1 - 0.4, y1 + drop],
        ],
        INK
      )
    );
  });
  return ops;
}

/* ------------------------------------ music ------------------------------------ */

const RIGHT_PATTERNS = [
  [6],
  [3, 3],
  [3, 1, 1, 1],
  [2, 1, 3],
  [1, 1, 1, 3],
  [3, 2, 1],
  [4, 2],
  [1, 1, 1, 1, 1, 1],
];
const ROOTS = [-3, -1, -4, -2, 0, -3, -5, -2];
const FLAT_STEPS_TREBLE = [4, 7, 3, 6, 2];

function composeMeasures(count: number) {
  const random = seeded(2026);
  const measures: { right: { step: number; length: number }[]; root: number }[] = [];
  let melody = 8;
  for (let index = 0; index < count; index += 1) {
    const root = ROOTS[index % ROOTS.length];
    let pattern = RIGHT_PATTERNS[Math.floor(random() * RIGHT_PATTERNS.length)];
    if (index === count - 1) {
      pattern = [6];
    }
    const right = pattern.map((length) => {
      const move = Math.round((random() - 0.5) * 4);
      melody = Math.max(4, Math.min(12, melody + (random() < 0.3 ? move : Math.sign(move))));
      return { step: melody, length };
    });
    measures.push({ right, root });
  }
  return measures;
}

/* ------------------------------------ pages ------------------------------------ */

const DYNAMICS: Record<number, string> = {
  0: 'p dolce',
  4: 'mp',
  9: 'cresc.',
  13: 'mf',
  18: 'dim.',
  22: 'p',
  27: 'cresc. poco a poco',
  32: 'f',
  37: 'dim. e rit.',
  42: 'mp',
  47: 'a tempo',
  52: 'cresc.',
  57: 'ff',
  62: 'dim.',
  67: 'p',
  72: 'rit.',
  76: 'pp',
};

function buildSystem(
  systemIndex: number,
  top: number,
  measureStart: number,
  measures: ReturnType<typeof composeMeasures>,
  first: boolean,
  lastSystem: boolean
): string[] {
  const trebleBottom = top - 4 * S;
  const bassTop = trebleBottom - TREBLE_TO_BASS;
  const bassBottom = bassTop - 4 * S;
  const ops: string[] = [];

  [trebleBottom, bassBottom].forEach((bottom) => {
    for (let l = 0; l < 5; l += 1) {
      ops.push(line(LEFT, bottom + l * S, RIGHT, bottom + l * S, { color: INK, width: 0.55 }));
    }
  });
  ops.push(line(LEFT, top, LEFT, bassBottom, { color: INK, width: 1 }));
  ops.push(brace(LEFT - 4, top, bassBottom));

  ops.push(trebleClef(LEFT + 9, trebleBottom));
  ops.push(bassClef(LEFT + 9, bassBottom));
  let cursor = LEFT + 30;
  FLAT_STEPS_TREBLE.forEach((step, index) => {
    ops.push(flat(cursor + index * 5.6, stepY(trebleBottom, step)));
    ops.push(flat(cursor + index * 5.6, stepY(bassBottom, step - 2)));
  });
  cursor += 5 * 5.6 + 8;
  if (systemIndex === 0) {
    ['6', '8'].forEach((digit, index) => {
      [trebleBottom, bassBottom].forEach((bottom) => {
        ops.push(
          text(cursor, bottom + (index === 0 ? 2 * S : 0) + 0.55, digit, {
            font: 'serifBold',
            size: 16.5,
            color: INK,
          })
        );
      });
    });
    cursor += 18;
  }
  const startX = cursor + 8;
  const widths = [1, 1, 1, 1].slice(0, MEASURES_PER_SYSTEM);
  const total = widths.reduce((a, b) => a + b, 0);
  const span = RIGHT - startX;

  if (!first || systemIndex > 0) {
    ops.push(
      text(LEFT - 2, top + 9, String(measureStart + 1), {
        font: 'serifItalic',
        size: 9,
        color: INK,
      })
    );
  }

  let x = startX;
  widths.forEach((weight, m) => {
    const measure = measures[measureStart + m];
    const width = (span * weight) / total;
    const pad = 11;
    const inner = width - pad * 2;
    const at = (onset: number) => x + pad + (inner * onset) / 6;

    let onset = 0;
    const rightNotes: Note[] = measure.right.map((n) => {
      const note = { x: at(onset), step: n.step, length: n.length, beat: onset < 3 ? 0 : 1 };
      onset += n.length;
      return note;
    });
    const leftNotes: Note[] = [0, 1, 2, 3, 4, 5].map((i) => ({
      x: at(i),
      step: measure.root + [0, 4, 7, 9, 7, 4][i],
      length: 1,
      beat: i < 3 ? 0 : 1,
    }));
    ops.push(...drawNotes(rightNotes, trebleBottom));
    ops.push(...drawNotes(leftNotes, bassBottom));

    // A slur over the phrase on every other measure
    if ((measureStart + m) % 2 === 0) {
      const a = rightNotes[0];
      const b = rightNotes[rightNotes.length - 1];
      const y = Math.max(top + S, ...rightNotes.map((n) => stepY(trebleBottom, n.step) + S * 1.6));
      if (a !== b) {
        ops.push(
          curve(
            [
              [a.x, y],
              [a.x + (b.x - a.x) * 0.3, y + S * 1.6],
              [a.x + (b.x - a.x) * 0.7, y + S * 1.6],
              [b.x, y],
            ],
            { width: 0.8 }
          )
        );
      }
    }

    // Dynamics sit between the staves
    const absolute = measureStart + m;
    const dynamic = DYNAMICS[absolute];
    if (dynamic) {
      ops.push(
        text(x + pad - 2, trebleBottom - 5.2 * S, dynamic, {
          font: 'serifItalic',
          size: 13,
          color: INK,
        })
      );
    }
    if (dynamic === 'cresc.' || dynamic?.startsWith('cresc')) {
      // hairline wedge after the word
      const wx = x + pad + 28;
      const wy = trebleBottom - 5.0 * S;
      ops.push(line(wx, wy + 3, wx + 36, wy + 7, { color: INK, width: 0.6 }));
      ops.push(line(wx, wy + 3, wx + 36, wy - 1, { color: INK, width: 0.6 }));
    }
    if (absolute % 6 === 0 && absolute > 0) {
      ops.push(
        text(x + pad - 2, bassBottom - 2.6 * S, 'Ped.', {
          font: 'serifItalic',
          size: 10.5,
          color: INK,
        })
      );
      ops.push(
        line(x + pad + 20, bassBottom - 2.4 * S, x + width - 4, bassBottom - 2.4 * S, {
          color: INK,
          width: 0.55,
        })
      );
    }

    x += width;
    const lastMeasure = m === MEASURES_PER_SYSTEM - 1;
    if (lastSystem && lastMeasure) {
      ops.push(line(RIGHT - 3.5, top, RIGHT - 3.5, bassBottom, { color: INK, width: 0.9 }));
      ops.push(rect(RIGHT - 1.5, bassBottom, 2.6, top - bassBottom, { fill: INK }));
    } else {
      ops.push(line(x, top, x, trebleBottom, { color: INK, width: 0.8 }));
      ops.push(line(x, bassTop, x, bassBottom, { color: INK, width: 0.8 }));
      if (lastMeasure) {
        ops.push(line(x, trebleBottom, x, bassTop, { color: INK, width: 0.8 }));
      }
    }
  });
  return ops;
}

function build() {
  const total = PAGE_SYSTEMS.reduce((a, b) => a + b, 0);
  const measures = composeMeasures(total * MEASURES_PER_SYSTEM);
  let systemCounter = 0;
  const pages: StoryPage[] = PAGE_SYSTEMS.map((count, pageIndex) => {
    const ops: string[] = [];
    let firstTop: number;
    if (pageIndex === 0) {
      ops.push(
        text(W / 2 - 150, H - 100, 'Nocturne in D-flat', { font: 'serif', size: 34, color: INK }),
        text(W / 2 - 58, H - 124, '"Lantern Hour"', { font: 'serifItalic', size: 17, color: INK }),
        text(RIGHT - 82, H - 90, 'Iris Calloway', { font: 'serif', size: 15, color: INK }),
        text(RIGHT - 70, H - 105, '(1884-1951)', { font: 'serif', size: 10, color: INK }),
        text(LEFT, H - 150, 'Andante sostenuto', { font: 'serifBold', size: 12.5, color: INK }),
        text(LEFT + 112, H - 150, '(♩. = 54)', { font: 'serif', size: 11.5, color: INK }),
        text(LEFT, H - 172, 'dolce, con pedale', { font: 'serifItalic', size: 11, color: INK })
      );
      firstTop = H - 205;
    } else {
      ops.push(
        text(LEFT, H - 50, 'Nocturne in D-flat', {
          font: 'serifItalic',
          size: 10.5,
          color: '#4b4540',
        }),
        text(RIGHT - 74, H - 50, 'I. Calloway', {
          font: 'serifItalic',
          size: 10.5,
          color: '#4b4540',
        })
      );
      firstTop = H - 100;
    }
    for (let s = 0; s < count; s += 1) {
      const top = firstTop - s * SYSTEM_PITCH;
      ops.push(
        ...buildSystem(
          pageIndex === 0 ? s : 1,
          top,
          systemCounter * MEASURES_PER_SYSTEM,
          measures,
          pageIndex === 0 && s === 0,
          systemCounter === total - 1
        )
      );
      systemCounter += 1;
    }
    ops.push(
      text(pageIndex % 2 === 0 ? RIGHT - 4 : LEFT, 34, String(pageIndex + 1), {
        font: 'serif',
        size: 11,
        color: INK,
      })
    );
    return { width: W, height: H, content: ops.join('\n') };
  });
  return {
    title: 'Nocturne in D-flat, "Lantern Hour"',
    author: 'Iris Calloway',
    subject: 'Piano solo',
    pages,
    outline: [
      { title: 'Theme', page: 1 },
      { title: 'Rising middle section', page: 3 },
      { title: 'Return of the theme', page: 5 },
    ],
  };
}

const source: StoryPdfSource = { fileName: 'nocturne.pdf', build };
export default source;
