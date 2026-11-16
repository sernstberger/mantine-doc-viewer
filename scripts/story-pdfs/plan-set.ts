/**
 * Construction drawing set for the Plan room story: 10 tabloid landscape sheets (1224 x 792)
 * of a two-storey medical office, with title blocks, grid bubbles, double-line walls, door
 * swings and dimension strings. Plans are drawn at 1/8" = 1'-0" (7.5 pt per foot).
 */
import {
  Color,
  ellipse,
  escapePdfText,
  fill,
  FONTS,
  FontKey,
  group,
  line,
  paragraph,
  rect,
  StoryPage,
  StoryPdfSource,
  stroke,
  text,
  textWidth,
} from './pdf-writer';

const W = 1224;
const H = 792;
const INK = '#1b1b1b';
const GREY = '#7d7d7d';
const LIGHT = '#d8d8d8';
const PAPER_TINT = '#f1f1f1';

/* ------------------------------ small helpers ------------------------------ */

type Pt = [number, number];

function poly(
  points: Pt[],
  options: { color?: Color; width?: number; dash?: number[]; close?: boolean; fill?: Color } = {}
) {
  const { color = INK, width = 1, dash, close = false, fill: fillColor } = options;
  const path = points
    .map(([x, y], i) => `${x.toFixed(2)} ${y.toFixed(2)} ${i ? 'l' : 'm'}`)
    .join(' ');
  const dashOp = dash ? `[${dash.join(' ')}] 0 d` : '[] 0 d';
  const closing = close || fillColor ? 'h ' : '';
  const paint = fillColor ? (width > 0 ? 'B' : 'f') : 'S';
  const colors = `${fillColor ? `${fill(fillColor)} ` : ''}${stroke(color)}`;
  return `${colors} ${width} w ${dashOp} ${path} ${closing}${paint} [] 0 d`;
}

function centered(
  x: number,
  y: number,
  value: string,
  size: number,
  font: FontKey = 'sans',
  color: Color = INK
) {
  const k = font === 'sansBold' ? 0.56 : 0.52;
  return text(x - (value.length * size * k) / 2, y, value, { size, font, color });
}

function textRot(
  x: number,
  y: number,
  value: string,
  size = 6,
  font: FontKey = 'sans',
  color: Color = INK
) {
  return `${fill(color)} BT /${FONTS[font]} ${size} Tf 0 1 -1 0 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`;
}

function arcPoints(cx: number, cy: number, r: number, from: number, to: number, steps = 14): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt;
  });
}

function hatch(
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  color: Color = '#9a9a9a',
  width = 0.3
) {
  const ops = [`${x} ${y} ${w} ${h} re W n`];
  for (let k = -h; k < w; k += gap) {
    ops.push(line(x + k, y, x + k + h, y + h, { color, width }));
  }
  return group(ops);
}

function ft(feet: number) {
  const whole = Math.floor(feet + 1e-6);
  const inches = Math.round((feet - whole) * 12);
  return `${whole}'-${inches}"`;
}

/** Dimension string between two x positions at height y, text above */
function dimH(xa: number, xb: number, y: number, label: string, tickFrom?: number) {
  const mid = (xa + xb) / 2;
  const tick = (x: number) => line(x - 2.5, y - 2.5, x + 2.5, y + 2.5, { width: 0.9 });
  return [
    line(xa, y, xb, y, { width: 0.45 }),
    tick(xa),
    tick(xb),
    tickFrom === undefined ? '' : line(xa, tickFrom, xa, y + 3, { width: 0.3, color: GREY }),
    rect(mid - (label.length * 6 * 0.52) / 2 - 2, y + 1.2, label.length * 6 * 0.52 + 4, 7, {
      fill: '#ffffff',
    }),
    centered(mid, y + 2.5, label, 6),
  ].join('\n');
}

function dimV(ya: number, yb: number, x: number, label: string, tickFrom?: number) {
  const mid = (ya + yb) / 2;
  const tick = (y: number) => line(x - 2.5, y - 2.5, x + 2.5, y + 2.5, { width: 0.9 });
  return [
    line(x, ya, x, yb, { width: 0.45 }),
    tick(ya),
    tick(yb),
    tickFrom === undefined ? '' : line(tickFrom, ya, x - 3, ya, { width: 0.3, color: GREY }),
    textRot(x - 2.5, mid - (label.length * 6 * 0.52) / 2, label, 6),
  ].join('\n');
}

function bubble(x: number, y: number, label: string, r = 9) {
  return [
    ellipse(x, y, r, r, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }),
    centered(x, y - 3.2, label, 9, 'sansBold'),
  ].join('\n');
}

/** Note with a leader line ending in a dot at (x, y), text starting at (tx, ty) */
function leader(x: number, y: number, tx: number, ty: number, label: string, size = 6.5) {
  return [
    line(x, y, tx, ty, { width: 0.4 }),
    ellipse(x, y, 1.2, 1.2, { fill: INK }),
    text(tx + (tx >= x ? 2 : -textWidth(label, size) - 2), ty - 2.2, label, { size }),
  ].join('\n');
}

function drawingTitle(x: number, y: number, number: string, title: string, scale?: string) {
  const width = Math.max(textWidth(title, 11) + 70, 170);
  return [
    ellipse(x + 11, y, 11, 11, { stroke: INK, lineWidth: 1 }),
    line(x, y, x + 22, y, { width: 0.5 }),
    centered(x + 11, y + 2.5, number, 9, 'sansBold'),
    text(x + 29, y - 3, title.toUpperCase(), { size: 11, font: 'sansBold' }),
    scale ? text(x + 29, y - 16, scale, { size: 7.5, color: '#444444' }) : '',
    line(x + 29, y - 6, x + width, y - 6, { width: 1.1 }),
  ].join('\n');
}

function table(
  x: number,
  top: number,
  widths: number[],
  rows: string[][],
  options: { rowHeight?: number; size?: number; header?: boolean } = {}
) {
  const { rowHeight = 14, size = 6.5, header = true } = options;
  const total = widths.reduce((a, b) => a + b, 0);
  const ops: string[] = [];
  rows.forEach((row, r) => {
    const y = top - (r + 1) * rowHeight;
    if (header && r === 0) {
      ops.push(rect(x, y, total, rowHeight, { fill: LIGHT }));
    }
    let cx = x;
    row.forEach((cell, c) => {
      ops.push(
        text(cx + 4, y + rowHeight / 2 - size * 0.35, cell, {
          size,
          font: header && r === 0 ? 'sansBold' : 'sans',
        })
      );
      cx += widths[c];
    });
  });
  ops.push(
    rect(x, top - rows.length * rowHeight, total, rows.length * rowHeight, {
      stroke: INK,
      lineWidth: 0.8,
    })
  );
  for (let r = 1; r < rows.length; r += 1) {
    const y = top - r * rowHeight;
    ops.push(line(x, y, x + total, y, { width: 0.3 }));
  }
  let cx = x;
  widths.slice(0, -1).forEach((w) => {
    cx += w;
    ops.push(line(cx, top, cx, top - rows.length * rowHeight, { width: 0.3 }));
  });
  return ops.join('\n');
}

function notes(
  x: number,
  top: number,
  heading: string,
  items: string[],
  width: number,
  size = 6.5
) {
  const ops = [
    text(x, top, heading.toUpperCase(), { size: 8, font: 'sansBold' }),
    line(x, top - 4, x + width, top - 4, { width: 0.8 }),
  ];
  let y = top - 17;
  items.forEach((item, index) => {
    ops.push(text(x, y, `${index + 1}.`, { size }));
    const block = paragraph(x + 12, y, item, { size, width: width - 12, leading: size * 1.4 });
    ops.push(block.ops);
    y = block.y - 3.5;
  });
  return { ops: ops.join('\n'), y };
}

function northArrow(x: number, y: number) {
  return [
    ellipse(x, y, 16, 16, { stroke: INK, lineWidth: 0.6 }),
    poly(
      [
        [x, y + 20],
        [x - 6, y - 12],
        [x, y - 6],
        [x + 6, y - 12],
      ],
      { close: true, fill: INK, width: 0.5 }
    ),
    centered(x, y + 24, 'N', 9, 'sansBold'),
  ].join('\n');
}

function scaleBar(x: number, y: number, pointsPerFoot: number) {
  const ops: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    ops.push(
      rect(x + i * 10 * pointsPerFoot, y, 10 * pointsPerFoot, 3.5, {
        fill: i % 2 ? '#ffffff' : INK,
        stroke: INK,
        lineWidth: 0.5,
      })
    );
  }
  [0, 10, 20, 30, 40].forEach((feet, i) => {
    ops.push(centered(x + i * 10 * pointsPerFoot, y - 8, String(feet), 6));
  });
  ops.push(text(x + 40 * pointsPerFoot + 8, y - 8, 'FT', { size: 6 }));
  return ops.join('\n');
}

/* ------------------------------ sheet and title block ------------------------------ */

interface SheetInfo {
  number: string;
  title: string;
  scale: string;
  discipline: 'G' | 'A' | 'S' | 'M' | 'E';
}

const FIRMS: Record<SheetInfo['discipline'], [string, string]> = {
  G: ['Okafor Lindqvist Architects', 'Architect of record'],
  A: ['Okafor Lindqvist Architects', 'Architect of record'],
  S: ['Reyes Structural Engineers', 'Structural engineer'],
  M: ['Calloway Mechanical Design', 'Mechanical engineer'],
  E: ['Bright Line Electrical', 'Electrical engineer'],
};

const DISCIPLINE_LABEL: Record<SheetInfo['discipline'], string> = {
  G: 'General',
  A: 'Architectural',
  S: 'Structural',
  M: 'Mechanical',
  E: 'Electrical',
};

const TB_X = 900;
const TB_W = 306;
const TB_Y = 18;

function titleBlock(info: SheetInfo) {
  const [firm, role] = FIRMS[info.discipline];
  const ops: string[] = [
    rect(TB_X, TB_Y, TB_W, 138, { fill: '#ffffff', stroke: INK, lineWidth: 1.4 }),
  ];
  // firm cell
  ops.push(line(TB_X, TB_Y + 104, TB_X + TB_W, TB_Y + 104, { width: 0.8 }));
  ops.push(rect(TB_X + 8, TB_Y + 110, 22, 22, { fill: INK }));
  ops.push(rect(TB_X + 13, TB_Y + 115, 12, 12, { fill: '#ffffff' }));
  ops.push(text(TB_X + 38, TB_Y + 123, firm, { size: 9.5, font: 'sansBold' }));
  ops.push(text(TB_X + 38, TB_Y + 112, role, { size: 6.5, color: '#555555' }));
  ops.push(text(TB_X + 190, TB_Y + 112, 'Lic. no. 4417', { size: 6, color: '#555555' }));
  // project cell
  ops.push(line(TB_X, TB_Y + 74, TB_X + TB_W, TB_Y + 74, { width: 0.8 }));
  ops.push(text(TB_X + 8, TB_Y + 94, 'Project', { size: 5.5, color: '#666666' }));
  ops.push(text(TB_X + 8, TB_Y + 82, 'Millbrook Medical Office', { size: 12, font: 'sansBold' }));
  ops.push(text(TB_X + 172, TB_Y + 82, '412 Alder Street, Millbrook', { size: 7 }));
  // meta row
  ops.push(line(TB_X, TB_Y + 52, TB_X + TB_W, TB_Y + 52, { width: 0.5 }));
  const meta: [string, string][] = [
    ['Issued', 'For construction'],
    ['Date', '12 Oct 2026'],
    ['Drawn', 'M. Rosen'],
    ['Checked', 'J. Lindqvist'],
  ];
  meta.forEach(([label, value], index) => {
    const x = TB_X + index * 76.5;
    if (index) {
      ops.push(line(x, TB_Y + 52, x, TB_Y + 74, { width: 0.3 }));
    }
    ops.push(text(x + 6, TB_Y + 66, label, { size: 5.5, color: '#666666' }));
    ops.push(text(x + 6, TB_Y + 56, value, { size: 7 }));
  });
  // title and number
  ops.push(line(TB_X + 206, TB_Y, TB_X + 206, TB_Y + 52, { width: 0.8 }));
  ops.push(
    text(TB_X + 8, TB_Y + 41, DISCIPLINE_LABEL[info.discipline], { size: 5.5, color: '#666666' })
  );
  const titleLines = paragraph(TB_X + 8, TB_Y + 29, info.title, {
    size: 11,
    font: 'sansBold',
    width: 190,
    leading: 12.5,
  });
  ops.push(titleLines.ops);
  ops.push(text(TB_X + 8, TB_Y + 6, `Scale: ${info.scale}`, { size: 6.5, color: '#444444' }));
  ops.push(text(TB_X + 214, TB_Y + 41, 'Sheet', { size: 5.5, color: '#666666' }));
  ops.push(text(TB_X + 214, TB_Y + 12, info.number, { size: 30, font: 'sansBold' }));
  return ops.join('\n');
}

function sheet(info: SheetInfo, body: string[]): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      rect(0, 0, W, H, { fill: '#ffffff' }),
      rect(18, 18, W - 36, H - 36, { stroke: INK, lineWidth: 1.6 }),
      ...body,
      titleBlock(info),
      // small print outside the title block
      text(
        24,
        8,
        'Do not scale drawings. Verify dimensions on site. Report discrepancies to the architect.',
        {
          size: 5.5,
          color: '#777777',
        }
      ),
    ].join('\n'),
  };
}

/* ------------------------------ plan geometry ------------------------------ */

const S = 7.5; // points per foot at 1/8" = 1'-0"
const OX = 110;
const OY = 222;
const BW = 104;
const BD = 60;
const EXT = 0.67;
const INT = 0.42;
const GRID_X = [0, 26, 52, 78, 104];
const GRID_Y = [0, 30, 60];

const px = (feet: number) => OX + feet * S;
const py = (feet: number) => OY + feet * S;

type Gap = [number, number];
interface Rect4 {
  x: number;
  y: number;
  w: number;
  h: number;
  ext: boolean;
}
interface Door {
  hx: number;
  hy: number;
  len: number;
  open: number;
  closed: number;
}

function split(from: number, to: number, gaps: Gap[]): Gap[] {
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  const out: Gap[] = [];
  let cursor = from;
  sorted.forEach(([a, b]) => {
    if (a > cursor) {
      out.push([cursor, a]);
    }
    cursor = Math.max(cursor, b);
  });
  if (cursor < to) {
    out.push([cursor, to]);
  }
  return out;
}

function hWall(y: number, x1: number, x2: number, thick: number, gaps: Gap[] = []): Rect4[] {
  return split(x1, x2, gaps).map(([a, b]) => ({
    x: a,
    y: y - thick / 2,
    w: b - a,
    h: thick,
    ext: thick === EXT,
  }));
}

function vWall(x: number, y1: number, y2: number, thick: number, gaps: Gap[] = []): Rect4[] {
  return split(y1, y2, gaps).map(([a, b]) => ({
    x: x - thick / 2,
    y: a,
    w: thick,
    h: b - a,
    ext: thick === EXT,
  }));
}

interface Room {
  name: string;
  number: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface FloorLayout {
  walls: Rect4[];
  doors: Door[];
  windows: { axis: 'h' | 'v'; at: number; range: Gap }[];
  rooms: Room[];
}

interface FloorConfig {
  level: 1 | 2;
  southParts: number[];
  southRooms: [name: string, number: string][];
  southDoors: Gap[]; // door gap in the corridor wall per south room, [start, length]
  northParts: number[];
  northRooms: [name: string, number: string][];
  northDoors: (Gap | null)[];
  southWindows: Gap[];
  northWindows: Gap[];
  eastWindows: Gap[];
  westWindows: Gap[];
}

const NORTH_BAND_PARTS_COMMON = [58, 68, 78, 86, 98];

const LEVEL_1: FloorConfig = {
  level: 1,
  southParts: [52, 68, 84],
  southRooms: [
    ['Lobby and reception', '101'],
    ['Exam 1', '102'],
    ['Exam 2', '103'],
    ['Procedure', '104'],
  ],
  southDoors: [
    [40, 6],
    [56, 3],
    [72, 3],
    [88, 3],
  ],
  northParts: [20, 38, ...NORTH_BAND_PARTS_COMMON],
  northRooms: [
    ['Break room', '105'],
    ['Billing', '106'],
    ['Lab', '107'],
    ['Men', '108'],
    ['Women', '109'],
    ['IT / electrical', '110'],
    ['Stair 1', 'S1'],
    ['Elevator', 'E1'],
  ],
  northDoors: [
    [8, 3],
    [28, 3],
    [44, 3],
    [61, 3],
    [71, 3],
    [80, 3],
    [90, 3],
    [99, 4],
  ],
  southWindows: [
    [4, 12],
    [22, 30],
    [56, 64],
    [72, 80],
    [88, 98],
  ],
  northWindows: [
    [3, 12],
    [23, 32],
    [42, 54],
  ],
  eastWindows: [[8, 18]],
  westWindows: [[44, 54]],
};

const LEVEL_2: FloorConfig = {
  level: 2,
  southParts: [28, 62, 84],
  southRooms: [
    ['Conference', '201'],
    ['Open workspace', '202'],
    ['Therapy gym', '203'],
    ['Consult', '204'],
  ],
  southDoors: [
    [14, 4],
    [44, 6],
    [70, 6],
    [88, 3],
  ],
  northParts: [14, 28, 42, ...NORTH_BAND_PARTS_COMMON],
  northRooms: [
    ['Office', '205'],
    ['Office', '206'],
    ['Office', '207'],
    ['Director', '208'],
    ['Men', '209'],
    ['Women', '210'],
    ['IT / electrical', '211'],
    ['Stair 1', 'S1'],
    ['Elevator', 'E1'],
  ],
  northDoors: [
    [4, 3],
    [18, 3],
    [32, 3],
    [46, 3],
    [61, 3],
    [71, 3],
    [80, 3],
    [90, 3],
    [99, 4],
  ],
  southWindows: [
    [3, 10],
    [14, 22],
    [32, 40],
    [46, 54],
    [66, 76],
    [88, 98],
  ],
  northWindows: [
    [3, 11],
    [17, 25],
    [31, 39],
    [46, 56],
  ],
  eastWindows: [[8, 18]],
  westWindows: [[6, 20]],
};

function layout(config: FloorConfig): FloorLayout {
  const southBounds = [0, ...config.southParts, BW];
  const northBounds = [0, ...config.northParts, BW];
  const southCorridorGaps = config.southDoors.map(([a, len]) => [a, a + len] as Gap);
  const northCorridorGaps = config.northDoors
    .filter(Boolean)
    .map((g) => [g![0], g![0] + g![1]] as Gap);
  const entry: Gap = [14, 20];
  const exit: Gap = [28, 31];

  const walls: Rect4[] = [
    ...hWall(0, 0, BW, EXT, [...config.southWindows, ...(config.level === 1 ? [entry] : [])]),
    ...hWall(BD, 0, BW, EXT, config.northWindows),
    ...vWall(0, 0, BD, EXT, [...config.westWindows, ...(config.level === 1 ? [exit] : [])]),
    ...vWall(BW, 0, BD, EXT, config.eastWindows),
    ...hWall(26, 0, BW, INT, southCorridorGaps),
    ...hWall(34, 0, BW, INT, northCorridorGaps),
    ...config.southParts.flatMap((x) => vWall(x, 0, 26, INT)),
    ...config.northParts.flatMap((x) => vWall(x, 34, BD, INT)),
  ];

  const doors: Door[] = [];
  const addDoor = (a: number, len: number, y: number, dir: 1 | -1) => {
    if (len >= 6) {
      const half = len / 2;
      doors.push({ hx: a, hy: y, len: half, open: dir * 90, closed: 0 });
      doors.push({ hx: a + len, hy: y, len: half, open: dir * 90, closed: 180 });
    } else {
      doors.push({ hx: a, hy: y, len, open: dir * 90, closed: 0 });
    }
  };
  config.southDoors.forEach(([a, len]) => addDoor(a, len, 26, -1));
  config.northDoors.forEach((gap, i) => {
    // the elevator opening has no leaf
    if (gap && i < config.northDoors.length - 1) {
      addDoor(gap[0], gap[1], 34, 1);
    }
  });
  if (config.level === 1) {
    addDoor(entry[0], 6, 0, 1);
    doors.push({ hx: 0, hy: exit[0], len: 3, open: 0, closed: 90 });
  }

  const rooms: Room[] = [];
  config.southRooms.forEach(([name, number], i) =>
    rooms.push({ name, number, x1: southBounds[i], x2: southBounds[i + 1], y1: 0, y2: 26 })
  );
  config.northRooms.forEach(([name, number], i) =>
    rooms.push({ name, number, x1: northBounds[i], x2: northBounds[i + 1], y1: 34, y2: BD })
  );

  const windows: FloorLayout['windows'] = [
    ...config.southWindows.map((range) => ({ axis: 'h' as const, at: 0, range })),
    ...config.northWindows.map((range) => ({ axis: 'h' as const, at: BD, range })),
    ...config.westWindows.map((range) => ({ axis: 'v' as const, at: 0, range })),
    ...config.eastWindows.map((range) => ({ axis: 'v' as const, at: BW, range })),
  ];
  return { walls, doors, windows, rooms };
}

const PLAN_1 = layout(LEVEL_1);
const PLAN_2 = layout(LEVEL_2);

/** Walls, windows and door swings. `ghost` draws them pale as a backdrop for other disciplines */
function planBase(plan: FloorLayout, ghost = false) {
  const lineColor = ghost ? '#b4b4b4' : INK;
  const extFill = ghost ? '#ececec' : '#b9b9b9';
  const intFill = ghost ? '#f3f3f3' : '#dedede';
  const ops: string[] = [];
  plan.walls.forEach((w) =>
    ops.push(
      rect(px(w.x), py(w.y), w.w * S, w.h * S, { stroke: lineColor, lineWidth: ghost ? 0.6 : 1 })
    )
  );
  plan.walls.forEach((w) => {
    const inset = ghost ? 0.3 : 0.5;
    ops.push(
      rect(px(w.x) + inset, py(w.y) + inset, w.w * S - inset * 2, w.h * S - inset * 2, {
        fill: w.ext ? extFill : intFill,
      })
    );
  });
  plan.windows.forEach(({ axis, at, range: [a, b] }) => {
    [-EXT / 2, 0, EXT / 2].forEach((offset) => {
      const width = offset === 0 ? 0.4 : 0.7;
      ops.push(
        axis === 'h'
          ? line(px(a), py(at + offset), px(b), py(at + offset), { color: lineColor, width })
          : line(px(at + offset), py(a), px(at + offset), py(b), { color: lineColor, width })
      );
    });
    ops.push(
      axis === 'h'
        ? line(px(a), py(at - EXT / 2), px(a), py(at + EXT / 2), { color: lineColor, width: 0.7 })
        : line(px(at - EXT / 2), py(a), px(at + EXT / 2), py(a), { color: lineColor, width: 0.7 }),
      axis === 'h'
        ? line(px(b), py(at - EXT / 2), px(b), py(at + EXT / 2), { color: lineColor, width: 0.7 })
        : line(px(at - EXT / 2), py(b), px(at + EXT / 2), py(b), { color: lineColor, width: 0.7 })
    );
  });
  plan.doors.forEach((door) => {
    const rad = (door.open * Math.PI) / 180;
    const hx = px(door.hx);
    const hy = py(door.hy);
    const r = door.len * S;
    ops.push(
      line(hx, hy, hx + r * Math.cos(rad), hy + r * Math.sin(rad), {
        color: lineColor,
        width: ghost ? 0.5 : 1,
      }),
      poly(arcPoints(hx, hy, r, door.open, door.closed), {
        color: ghost ? '#c8c8c8' : GREY,
        width: 0.4,
      })
    );
  });
  return ops.join('\n');
}

function gridAndDims(plan: { topDims?: boolean } = {}) {
  const ops: string[] = [];
  // gridlines
  GRID_X.forEach((x, i) => {
    ops.push(
      line(px(x), py(-9), px(x), py(BD + 9), { color: GREY, width: 0.35, dash: [14, 3, 2, 3] })
    );
    ops.push(bubble(px(x), py(BD) + 60, String(i + 1)));
    ops.push(
      line(px(x), py(BD) + 8, px(x), py(BD) + 51, {
        color: GREY,
        width: 0.35,
        dash: [14, 3, 2, 3],
      })
    );
    ops.push(bubble(px(x), py(0) - 60, String(i + 1)));
    ops.push(
      line(px(x), py(0) - 8, px(x), py(0) - 51, { color: GREY, width: 0.35, dash: [14, 3, 2, 3] })
    );
  });
  GRID_Y.forEach((y, i) => {
    const label = 'ABC'[i];
    ops.push(
      line(px(0) - 8, py(y), px(0) - 49, py(y), { color: GREY, width: 0.35, dash: [14, 3, 2, 3] })
    );
    ops.push(bubble(px(0) - 58, py(y), label));
    ops.push(
      line(px(BW) + 8, py(y), px(BW) + 41, py(y), {
        color: GREY,
        width: 0.35,
        dash: [14, 3, 2, 3],
      })
    );
    ops.push(bubble(px(BW) + 50, py(y), label));
  });
  if (plan.topDims !== false) {
    // bay dimensions and overall, top and left
    GRID_X.slice(0, -1).forEach((x, i) => {
      ops.push(dimH(px(x), px(GRID_X[i + 1]), py(BD) + 22, ft(26), py(BD) + 4));
    });
    ops.push(dimH(px(0), px(BW), py(BD) + 36, ft(BW), py(BD) + 20));
    ops.push(dimV(py(0), py(30), px(0) - 18, ft(30), px(0) - 6));
    ops.push(dimV(py(30), py(60), px(0) - 18, ft(30)));
    ops.push(dimV(py(0), py(BD), px(0) - 32, ft(BD), px(0) - 26));
  }
  return ops.join('\n');
}

function roomTags(plan: FloorLayout) {
  return plan.rooms
    .map((room) => {
      const shift = room.name.startsWith('Lobby') ? -9 : room.name.startsWith('Stair') ? 3 : 0;
      const cx = px((room.x1 + room.x2) / 2 + shift);
      const wide = (room.x2 - room.x1) * S;
      const size = wide < 80 ? 5.2 : 6.4;
      const words = room.name.toUpperCase().split(' ');
      const lines: string[] = [];
      let current = '';
      words.forEach((word) => {
        if (`${current} ${word}`.trim().length * size * 0.56 > wide - 8 && current) {
          lines.push(current);
          current = word;
        } else {
          current = `${current} ${word}`.trim();
        }
      });
      lines.push(current);
      const cy = py((room.y1 + room.y2) / 2) + (room.y1 === 0 ? 4 : -2);
      return [
        ...lines.map((l, i) => centered(cx, cy - i * (size + 1.5), l, size, 'sansBold')),
        centered(cx, cy - lines.length * (size + 1.5) - 1, room.number, size, 'sans', '#555555'),
      ].join('\n');
    })
    .join('\n');
}

function fixtureRect(x: number, y: number, w: number, h: number, color: Color = '#555555') {
  return rect(px(x), py(y), w * S, h * S, { stroke: color, lineWidth: 0.5 });
}

function toilet(x: number, y: number, facing: 1 | -1) {
  // tank against the wall then bowl
  return [
    fixtureRect(x, y, 1.4, 0.7),
    ellipse(px(x + 0.7), py(y + facing * 1), 0.7 * S, 1 * S, { stroke: '#555555', lineWidth: 0.5 }),
  ].join('\n');
}

function level1Fixtures() {
  const ops: string[] = [];
  // reception desk and chairs
  ops.push(
    poly(
      [
        [28, 20],
        [28, 14],
        [46, 14],
        [46, 17],
      ].map(([x, y]) => [px(x), py(y)] as Pt),
      { color: '#555555', width: 0.7 }
    )
  );
  ops.push(fixtureRect(28, 17, 14, 1.4));
  [6, 10, 14, 18].forEach((x) => ops.push(fixtureRect(x, 3.5, 2, 2)));
  [6, 10, 14, 18].forEach((x) => ops.push(fixtureRect(x, 21, 2, 2)));
  // exam rooms: table, sink, stool
  [52, 68].forEach((x0) => {
    ops.push(fixtureRect(x0 + 2, 9, 2.4, 6.2));
    ops.push(fixtureRect(x0 + 12, 21, 3, 1.6));
    ellipse(0, 0, 0, 0);
    ops.push(ellipse(px(x0 + 8), py(8), 0.9 * S, 0.9 * S, { stroke: '#555555', lineWidth: 0.5 }));
    ops.push(fixtureRect(x0 + 1, 1, 8, 1.6));
  });
  // procedure room
  ops.push(fixtureRect(88, 8, 3.4, 7));
  ops.push(fixtureRect(96, 1, 7, 1.8));
  ops.push(fixtureRect(86, 21, 8, 1.6));
  // north band: break room
  ops.push(fixtureRect(1, 54, 15, 1.9));
  ops.push(fixtureRect(8, 40, 6, 3.4));
  ops.push(fixtureRect(1, 36, 2.4, 2.4));
  // billing desks
  [22, 30].forEach((x) => ops.push(fixtureRect(x, 52.5, 5, 2.4)));
  ops.push(fixtureRect(22, 36, 14, 1.6));
  // lab benches
  ops.push(fixtureRect(39, 58, 18, 1.8));
  ops.push(fixtureRect(56, 40, 1.8, 16));
  ops.push(fixtureRect(44, 45, 8, 3));
  // toilets and sinks
  [
    [59, 'M'],
    [69, 'W'],
  ].forEach(([x]) => {
    const x0 = x as number;
    ops.push(toilet(x0 + 1.2, 58.7, -1), toilet(x0 + 6.2, 58.7, -1));
    ops.push(fixtureRect(x0 + 0.6, 35.2, 3, 1.4), fixtureRect(x0 + 5, 35.2, 3, 1.4));
  });
  // IT: rack
  ops.push(fixtureRect(79, 55, 3, 3.5));
  ops.push(fixtureRect(83, 55, 2, 3.5));
  // stair: treads and arrow
  for (let i = 0; i <= 22; i += 1) {
    const y = 36.5 + i;
    ops.push(line(px(86.5), py(y), px(92.1), py(y), { color: '#555555', width: 0.4 }));
    ops.push(line(px(92.9), py(y), px(97.5), py(y), { color: '#555555', width: 0.4 }));
  }
  ops.push(rect(px(92.1), py(36.5), 0.8 * S, 22.5 * S, { stroke: '#555555', lineWidth: 0.5 }));
  ops.push(
    poly(
      [
        [px(89.3), py(40)],
        [px(89.3), py(52)],
      ],
      { color: INK, width: 0.8 }
    )
  );
  ops.push(
    poly(
      [
        [px(88.4), py(50)],
        [px(89.3), py(53.5)],
        [px(90.2), py(50)],
      ],
      { fill: INK, width: 0.3 }
    )
  );
  ops.push(centered(px(89.3), py(55.2), 'UP', 5.2, 'sansBold'));
  // elevator: car with X
  ops.push(rect(px(98.8), py(37), 4.4 * S, 5.6 * S, { stroke: INK, lineWidth: 0.8 }));
  ops.push(line(px(98.8), py(37), px(103.2), py(42.6), { width: 0.5 }));
  ops.push(line(px(98.8), py(42.6), px(103.2), py(37), { width: 0.5 }));
  // entry mat and vestibule note
  ops.push(rect(px(13.5), py(1), 7 * S, 4.5 * S, { stroke: GREY, lineWidth: 0.4 }));
  ops.push(hatch(px(13.5), py(1), 7 * S, 4.5 * S, 3, '#aaaaaa', 0.25));
  return ops.join('\n');
}

function level2Fixtures() {
  const ops: string[] = [];
  // conference table with chairs
  ops.push(fixtureRect(6, 9, 16, 6));
  [7, 11, 15, 19].forEach((x) => {
    ops.push(fixtureRect(x, 7, 1.6, 1.6), fixtureRect(x, 15.4, 1.6, 1.6));
  });
  // open workspace desks
  [32, 40, 48, 56].forEach((x) => {
    ops.push(fixtureRect(x, 18, 6, 2.6), fixtureRect(x, 8, 6, 2.6));
  });
  // therapy gym: mats, parallel bars, treadmills
  ops.push(fixtureRect(64, 3, 10, 7));
  ops.push(fixtureRect(66, 15, 1, 8), fixtureRect(69, 15, 1, 8));
  ops.push(fixtureRect(78, 3, 3, 6), fixtureRect(78, 12, 3, 6));
  // consult
  ops.push(fixtureRect(88, 15, 8, 3), fixtureRect(97, 3, 4, 3));
  // offices
  [
    [1, 56],
    [15, 56],
    [29, 56],
    [44, 55],
  ].forEach(([x, y]) => {
    ops.push(fixtureRect(x + 1, y, 7, 2.6), fixtureRect(x + 3, y - 3.5, 2, 1.6));
  });
  // toilets
  [59, 69].forEach((x0) => {
    ops.push(toilet(x0 + 1.2, 58.7, -1), toilet(x0 + 6.2, 58.7, -1));
    ops.push(fixtureRect(x0 + 0.6, 35.2, 3, 1.4), fixtureRect(x0 + 5, 35.2, 3, 1.4));
  });
  ops.push(fixtureRect(79, 55, 3, 3.5), fixtureRect(83, 55, 2, 3.5));
  for (let i = 0; i <= 22; i += 1) {
    const y = 36.5 + i;
    ops.push(line(px(86.5), py(y), px(92.1), py(y), { color: '#555555', width: 0.4 }));
    ops.push(line(px(92.9), py(y), px(97.5), py(y), { color: '#555555', width: 0.4 }));
  }
  ops.push(rect(px(92.1), py(36.5), 0.8 * S, 22.5 * S, { stroke: '#555555', lineWidth: 0.5 }));
  ops.push(
    poly(
      [
        [px(89.3), py(52)],
        [px(89.3), py(40)],
      ],
      { color: INK, width: 0.8 }
    )
  );
  ops.push(
    poly(
      [
        [px(88.4), py(42)],
        [px(89.3), py(38.5)],
        [px(90.2), py(42)],
      ],
      { fill: INK, width: 0.3 }
    )
  );
  ops.push(centered(px(89.3), py(55.2), 'DN', 5.2, 'sansBold'));
  ops.push(rect(px(98.8), py(37), 4.4 * S, 5.6 * S, { stroke: INK, lineWidth: 0.8 }));
  ops.push(line(px(98.8), py(37), px(103.2), py(42.6), { width: 0.5 }));
  ops.push(line(px(98.8), py(42.6), px(103.2), py(37), { width: 0.5 }));
  return ops.join('\n');
}

function sectionMarker(
  x: number,
  y: number,
  number: string,
  sheetNo: string,
  direction: 'up' | 'down' | 'left' | 'right'
) {
  const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  const dy = direction === 'up' ? 1 : direction === 'down' ? -1 : 0;
  return [
    ellipse(x, y, 9, 9, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }),
    line(x - 9, y, x + 9, y, { width: 0.5 }),
    centered(x, y + 1.8, number, 7.5, 'sansBold'),
    centered(x, y - 7, sheetNo, 5.5),
    poly(
      [
        [x + dx * 9 + dy * 4, y + dy * 9 + dx * 4],
        [x + dx * 15, y + dy * 15],
        [x + dx * 9 - dy * 4, y + dy * 9 - dx * 4],
      ],
      { close: true, fill: INK, width: 0.3 }
    ),
  ].join('\n');
}

function keyNotes(x: number, top: number, heading: string, items: string[], width = 190) {
  return notes(x, top, heading, items, width);
}

/* ---------------------------------- sheets ---------------------------------- */

const SHEETS: SheetInfo[] = [
  { number: 'G-001', title: 'Cover sheet and drawing index', scale: 'As noted', discipline: 'G' },
  { number: 'A-101', title: 'Level 1 floor plan', scale: '1/8" = 1\'-0"', discipline: 'A' },
  { number: 'A-102', title: 'Level 2 floor plan', scale: '1/8" = 1\'-0"', discipline: 'A' },
  { number: 'A-201', title: 'Exterior elevations', scale: '1/16" = 1\'-0"', discipline: 'A' },
  {
    number: 'A-301',
    title: 'Building section and wall section',
    scale: 'As noted',
    discipline: 'A',
  },
  { number: 'S-101', title: 'Foundation plan', scale: '1/8" = 1\'-0"', discipline: 'S' },
  {
    number: 'S-201',
    title: 'Level 2 framing and slab pour plan',
    scale: '1/8" = 1\'-0"',
    discipline: 'S',
  },
  { number: 'S-301', title: 'Typical structural details', scale: 'As noted', discipline: 'S' },
  { number: 'M-101', title: 'Level 1 mechanical plan', scale: '1/8" = 1\'-0"', discipline: 'M' },
  {
    number: 'E-101',
    title: 'Level 1 lighting and power plan',
    scale: '1/8" = 1\'-0"',
    discipline: 'E',
  },
];

function info(number: string) {
  return SHEETS.find((s) => s.number === number)!;
}

function coverSheet(): StoryPage {
  const ops: string[] = [];
  ops.push(text(48, 700, 'Millbrook', { size: 46, font: 'sansBold' }));
  ops.push(text(48, 650, 'Medical Office', { size: 46, font: 'sansBold' }));
  ops.push(rect(48, 628, 90, 5, { fill: INK }));
  ops.push(
    text(48, 592, 'New two-storey outpatient clinic, 6,240 square feet per floor', { size: 11 })
  );
  ops.push(text(48, 574, '412 Alder Street, Millbrook', { size: 11 }));
  ops.push(text(48, 548, 'Owner', { size: 6.5, color: '#666666' }));
  ops.push(text(48, 537, 'Alder Street Health Partners', { size: 10, font: 'sansBold' }));
  ops.push(text(48, 516, 'General contractor', { size: 6.5, color: '#666666' }));
  ops.push(text(48, 505, 'Harlan & Voss Construction', { size: 10, font: 'sansBold' }));
  ops.push(text(48, 484, 'Permit', { size: 6.5, color: '#666666' }));
  ops.push(text(48, 473, 'BP-26-04417, issued 2 October 2026', { size: 10, font: 'sansBold' }));

  // Site plan
  const sx = 48;
  const sy = 190;
  ops.push(text(sx, 440, 'SITE PLAN', { size: 8, font: 'sansBold' }));
  ops.push(line(sx, 436, sx + 270, 436, { width: 0.8 }));
  ops.push(rect(sx, sy, 270, 235, { fill: PAPER_TINT, stroke: INK, lineWidth: 0.9 }));
  ops.push(rect(sx, sy, 270, 24, { fill: '#cfcfcf' }));
  ops.push(centered(sx + 135, sy + 13, 'ALDER STREET', 8, 'sansBold'));
  ops.push(line(sx, sy + 6, sx + 270, sy + 6, { color: '#ffffff', width: 0.6, dash: [6, 5] }));
  ops.push(rect(sx + 20, sy + 70, 142, 82, { fill: '#ffffff', stroke: INK, lineWidth: 1.4 }));
  ops.push(centered(sx + 91, sy + 106, 'MEDICAL OFFICE', 7, 'sansBold'));
  ops.push(centered(sx + 91, sy + 96, '2 storeys', 6));
  ops.push(rect(sx + 176, sy + 40, 80, 150, { fill: '#e9e9e9', stroke: GREY, lineWidth: 0.5 }));
  for (let i = 0; i < 7; i += 1) {
    ops.push(
      line(sx + 176, sy + 54 + i * 20, sx + 200, sy + 54 + i * 20, { color: GREY, width: 0.4 })
    );
    ops.push(
      line(sx + 232, sy + 54 + i * 20, sx + 256, sy + 54 + i * 20, { color: GREY, width: 0.4 })
    );
  }
  ops.push(centered(sx + 216, sy + 205, 'PARKING', 6.5, 'sansBold'));
  ops.push(centered(sx + 216, sy + 196, '28 SPACES', 6));
  ops.push(
    poly(
      [
        [sx + 40, sy + 24],
        [sx + 40, sy + 70],
      ],
      { color: GREY, width: 3 }
    )
  );
  ops.push(text(sx + 46, sy + 40, 'Entry walk', { size: 6 }));
  ops.push(northArrow(sx + 40, sy + 195));
  ops.push(text(sx + 20, sy + 160, 'Property line', { size: 6, color: '#666666' }));
  ops.push(
    poly(
      [
        [sx + 14, sy + 30],
        [sx + 14, sy + 225],
        [sx + 262, sy + 225],
        [sx + 262, sy + 30],
      ],
      { color: INK, width: 0.7, dash: [10, 3, 2, 3] }
    )
  );

  // Drawing index
  const rows = [
    ['Sheet', 'Title', 'Discipline'],
    ...SHEETS.map((s) => [s.number, s.title, DISCIPLINE_LABEL[s.discipline]]),
  ];
  ops.push(text(450, 700, 'DRAWING INDEX', { size: 8, font: 'sansBold' }));
  ops.push(line(450, 696, 450 + 470, 696, { width: 0.8 }));
  ops.push(table(450, 690, [70, 290, 110], rows, { rowHeight: 21, size: 8.5 }));

  // Code data
  const data = notes(
    450,
    430,
    'Code summary',
    [
      'Construction type: II-B, non-combustible, fully sprinklered (NFPA 13).',
      'Occupancy: B, outpatient clinic. Occupant load 124 (Level 1: 68, Level 2: 56).',
      'Building area: 12,480 sq ft, two floors of 6,240 sq ft. Height 31 ft to parapet.',
      'Exits: two per floor. Stair 1 is enclosed in 1-hour construction.',
      'Accessibility: ADA and state accessibility code, elevator serves both floors.',
      'Concrete pours on elevated decks are inspected by the special inspector before placement.',
    ],
    470
  );
  ops.push(data.ops);
  const team = notes(
    950,
    700,
    'Project team',
    [
      'Architect: Okafor Lindqvist Architects, Millbrook.',
      'Structural: Reyes Structural Engineers.',
      'Mechanical: Calloway Mechanical Design.',
      'Electrical: Bright Line Electrical.',
      'Geotechnical: Tillman Soils.',
      'Special inspector: Dunmore Testing.',
    ],
    230
  );
  ops.push(team.ops);

  ops.push(
    text(
      48,
      160,
      'Abbreviations: TYP typical, U.N.O. unless noted otherwise, CJ control joint, SOG slab on grade.',
      { size: 7, color: '#555555' }
    )
  );
  const page = sheet(info('G-001'), ops);
  return page;
}

function floorSheet(level: 1 | 2): StoryPage {
  const plan = level === 1 ? PLAN_1 : PLAN_2;
  const ops: string[] = [
    gridAndDims(),
    planBase(plan),
    level === 1 ? level1Fixtures() : level2Fixtures(),
    roomTags(plan),
    drawingTitle(
      px(0),
      py(0) - 100,
      level === 1 ? '1' : '1',
      level === 1 ? 'Level 1 floor plan' : 'Level 2 floor plan',
      '1/8" = 1\'-0"'
    ),
    northArrow(px(0) + 330, py(0) - 96),
    scaleBar(px(0) + 400, py(0) - 92, S),
  ];
  if (level === 1) {
    ops.push(line(px(-2), py(45), px(BW) + 30, py(45), { width: 1.2, dash: [10, 3, 2, 3] }));
    ops.push(sectionMarker(px(BW) + 40, py(45), 'A', 'A-301', 'up'));
    ops.push(leader(px(17), py(0) - 2, px(17), py(0) - 80, 'Main entry'));
  }
  const side = keyNotes(
    px(BW) + 98,
    py(BD) + 70,
    level === 1 ? 'Plan notes' : 'Plan notes',
    level === 1
      ? [
          'Dimensions are to face of stud or centre of gridline unless noted.',
          'Door 101 is a pair of 3-foot automatic doors at the main entry.',
          'Corridor 108 is 8 feet clear. Keep the west exit door unobstructed.',
          'Provide blocking in walls at all grab bars and wall-hung equipment.',
          'Fire extinguisher cabinets at the corridor ends and beside Stair 1.',
        ]
      : [
          'Level 2 slab is composite steel deck. See S-201 for the pour sequence.',
          'Therapy gym 203 floor is polished concrete with a sealed finish.',
          'Conference 201 and Director 208 receive acoustic rated partitions.',
          'Stair 1 and Elevator E1 align with Level 1 below.',
        ],
    144
  );
  ops.push(side.ops);
  return sheet(info(level === 1 ? 'A-101' : 'A-102'), ops);
}

/* --------------------------- A-201 elevations --------------------------- */

function elevation(
  x0: number,
  y0: number,
  s: number,
  width: number,
  windows: { x: number; w: number; level: 1 | 2; store?: boolean }[],
  options: { entry?: Gap; label: string; number: string; datums?: boolean }
) {
  const ops: string[] = [];
  const top = y0 + 28 * s;
  const parapet = y0 + 31 * s;
  // ground and brick
  ops.push(rect(x0, y0, width * s, 31 * s, { fill: '#f6f6f6', stroke: INK, lineWidth: 1.1 }));
  for (let y = y0 + 3; y < parapet; y += 3) {
    ops.push(line(x0, y, x0 + width * s, y, { color: '#cfcfcf', width: 0.25 }));
  }
  // base band and parapet cap
  ops.push(rect(x0, y0, width * s, 2.5 * s, { fill: '#c8c8c8', stroke: INK, lineWidth: 0.5 }));
  ops.push(
    rect(x0 - 1.5, parapet, width * s + 3, 2.2, { fill: '#9a9a9a', stroke: INK, lineWidth: 0.6 })
  );
  // floor line
  ops.push(line(x0, y0 + 14 * s, x0 + width * s, y0 + 14 * s, { width: 0.6, dash: [6, 2] }));
  ops.push(line(x0, top, x0 + width * s, top, { width: 0.6, dash: [6, 2] }));
  // windows
  windows.forEach((win) => {
    const sill = (win.level === 1 ? (win.store ? 1.5 : 3) : 17) * s;
    const head = (win.level === 1 ? 10.5 : 24.5) * s;
    const wx = x0 + win.x * s;
    ops.push(
      rect(wx, y0 + sill, win.w * s, head - sill, { fill: '#ffffff', stroke: INK, lineWidth: 0.9 })
    );
    const panes = Math.max(2, Math.round(win.w / 3.5));
    for (let i = 1; i < panes; i += 1) {
      ops.push(
        line(wx + (win.w * s * i) / panes, y0 + sill, wx + (win.w * s * i) / panes, y0 + head, {
          width: 0.4,
        })
      );
    }
    ops.push(line(wx, y0 + head - 2.5 * s, wx + win.w * s, y0 + head - 2.5 * s, { width: 0.4 }));
    ops.push(line(wx - 1, y0 + sill - 1, wx + win.w * s + 1, y0 + sill - 1, { width: 0.8 }));
  });
  if (options.entry) {
    const [a, b] = options.entry;
    ops.push(
      rect(x0 + a * s, y0, (b - a) * s, 8 * s, { fill: '#ffffff', stroke: INK, lineWidth: 0.9 })
    );
    ops.push(line(x0 + ((a + b) / 2) * s, y0, x0 + ((a + b) / 2) * s, y0 + 8 * s, { width: 0.6 }));
    ops.push(
      rect(x0 + (a - 3) * s, y0 + 10 * s, (b - a + 6) * s, 1 * s, {
        fill: '#8f8f8f',
        stroke: INK,
        lineWidth: 0.7,
      })
    );
    ops.push(
      line(x0 + (a - 1.5) * s, y0 + 10 * s, x0 + (a - 1.5) * s, y0 + 8.4 * s, { width: 0.6 })
    );
    ops.push(
      line(x0 + (b + 1.5) * s, y0 + 10 * s, x0 + (b + 1.5) * s, y0 + 8.4 * s, { width: 0.6 })
    );
  }
  // ground line
  ops.push(line(x0 - 30, y0, x0 + width * s + 30, y0, { width: 1.8 }));
  ops.push(hatch(x0 - 30, y0 - 8, width * s + 60, 8, 4, '#aaaaaa', 0.3));
  if (options.datums) {
    const dx = x0 + width * s + 12;
    [
      ['LEVEL 1', 0, '0\'-0"'],
      ['LEVEL 2', 14, '14\'-0"'],
      ['ROOF', 28, '28\'-0"'],
      ['TOP OF PARAPET', 31, '31\'-0"'],
    ].forEach(([name, elevationFt, label]) => {
      const y = y0 + (elevationFt as number) * s;
      ops.push(line(x0 + width * s, y, dx + 8, y, { width: 0.3, color: GREY }));
      ops.push(
        poly(
          [
            [dx, y],
            [dx + 8, y + 5],
            [dx - 8, y + 5],
          ].map(([a, b]) => [a + 4, b - 2.5] as Pt),
          { close: true, fill: INK, width: 0.3 }
        )
      );
      ops.push(text(dx + 16, y - 2, `${name}  ${label}`, { size: 5.5 }));
    });
  }
  ops.push(drawingTitle(x0, y0 - 28, options.number, options.label, '1/16" = 1\'-0"'));
  return ops.join('\n');
}

function elevationsSheet(): StoryPage {
  const s = 4.5;
  const south = [
    { x: 4, w: 8, level: 1 as const, store: true },
    { x: 22, w: 8, level: 1 as const, store: true },
    { x: 56, w: 8, level: 1 as const },
    { x: 72, w: 8, level: 1 as const },
    { x: 88, w: 10, level: 1 as const },
    ...[4, 16, 32, 46, 66, 88].map((x) => ({ x, w: x === 66 ? 10 : 8, level: 2 as const })),
  ];
  const north = [3, 23, 42, 58, 70, 88]
    .map((x) => ({ x, w: 8, level: 1 as const }))
    .concat([3, 17, 31, 46, 66, 88].map((x) => ({ x, w: 8, level: 2 as never })));
  const side = (offset: number) => [
    { x: offset, w: 8, level: 1 as const },
    { x: offset, w: 8, level: 2 as const },
    { x: offset + 22, w: 6, level: 2 as const },
    { x: offset + 36, w: 8, level: 2 as const },
  ];
  const ops = [
    elevation(60, 520, s, BW, south, {
      entry: [14, 20],
      label: 'South elevation',
      number: '1',
      datums: true,
    }),
    elevation(650, 520, s, BD, side(8), { label: 'East elevation', number: '2' }),
    elevation(60, 270, s, BW, north, { label: 'North elevation', number: '3' }),
    elevation(650, 270, s, BD, side(18), { label: 'West elevation', number: '4' }),
  ];
  ops.push(leader(96, 520 + 6 * s, 96, 722, '1  Storefront glazing, clear low-e'));
  ops.push(leader(60 + 17 * s, 520 + 10.5 * s, 60 + 17 * s, 706, '2  Aluminium canopy, 6 ft deep'));
  ops.push(leader(60 + 70 * s, 520 + 20 * s, 60 + 70 * s, 690, '3  Face brick, running bond'));
  const legend = keyNotes(
    960,
    735,
    'Exterior finishes',
    [
      'Face brick, Belden "Harbor Grey", 3/8 in. grey mortar.',
      'Aluminium storefront and windows, dark bronze anodised.',
      'Precast concrete base, 30 in. high, sandblast finish.',
      'Metal coping, 14 gauge, colour to match windows.',
      'Roof drains discharge to internal leaders. No downspouts on elevations.',
    ],
    226
  );
  ops.push(legend.ops);
  return sheet(info('A-201'), ops);
}

/* --------------------------- A-301 sections --------------------------- */

function sectionsSheet(): StoryPage {
  const ops: string[] = [];
  const s = 6.75;
  const x0 = 70;
  const gl = 440; // ground level y
  const slabT = 0.5 * s * 1.2;
  // cut ground
  ops.push(rect(x0 - 40, gl - 70, BW * s + 80, 70, { fill: '#f2f2f2' }));
  ops.push(hatch(x0 - 40, gl - 70, BW * s + 80, 70, 5, '#aaaaaa', 0.3));
  // footings
  GRID_X.forEach((gx) => {
    const x = x0 + gx * s;
    ops.push(
      rect(x - 3.5 * s, gl - 5.2 * s, 7 * s, 1.7 * s, {
        fill: '#ffffff',
        stroke: INK,
        lineWidth: 0.9,
      })
    );
    ops.push(
      rect(x - 1 * s, gl - 3.5 * s, 2 * s, 3.5 * s, {
        fill: '#ffffff',
        stroke: INK,
        lineWidth: 0.9,
      })
    );
  });
  // building volume
  ops.push(rect(x0, gl, BW * s, 31 * s, { fill: '#ffffff', stroke: INK, lineWidth: 1.2 }));
  // floors, roof slabs
  [0, 14, 28].forEach((level) => {
    ops.push(
      rect(
        x0 - 3,
        gl + level * s - (level === 0 ? 0.5 * s : 0),
        BW * s + 6,
        level === 0 ? 0.5 * s : slabT + 2,
        { fill: '#2a2a2a' }
      )
    );
  });
  // columns
  GRID_X.forEach((gx) => {
    const x = x0 + gx * s;
    ops.push(rect(x - 3, gl, 6, 28 * s, { fill: '#3a3a3a' }));
  });
  // perimeter walls cut
  ops.push(rect(x0 - 2, gl, 5, 31 * s, { fill: '#999999', stroke: INK, lineWidth: 0.7 }));
  ops.push(rect(x0 + BW * s - 3, gl, 5, 31 * s, { fill: '#999999', stroke: INK, lineWidth: 0.7 }));
  // interior partitions in the distance
  [20, 44, 62, 78].forEach((x) => {
    ops.push(
      line(x0 + x * s, gl + 0.5 * s, x0 + x * s, gl + 13.5 * s, { color: '#bcbcbc', width: 0.8 })
    );
    ops.push(
      line(x0 + x * s, gl + 14.5 * s, x0 + x * s, gl + 27.5 * s, { color: '#bcbcbc', width: 0.8 })
    );
  });
  // stair flight in the east bay
  for (let i = 0; i < 16; i += 1) {
    ops.push(
      poly(
        [
          [x0 + 86 * s + i * 7, gl + 0.5 * s + i * 7.4],
          [x0 + 86 * s + i * 7 + 7, gl + 0.5 * s + i * 7.4],
          [x0 + 86 * s + i * 7 + 7, gl + 0.5 * s + i * 7.4 + 7.4],
        ],
        { color: INK, width: 0.5 }
      )
    );
  }
  // dimension chain on the right
  const rx = x0 + BW * s + 36;
  [
    [0, 14, '14\'-0"'],
    [14, 28, '14\'-0"'],
    [28, 31, '3\'-0"'],
  ].forEach(([a, b, label]) => {
    ops.push(
      dimV(gl + (a as number) * s, gl + (b as number) * s, rx, label as string, x0 + BW * s + 4)
    );
  });
  // datum symbols left
  [
    ['LEVEL 1', 0, '0\'-0"'],
    ['LEVEL 2', 14, '14\'-0"'],
    ['ROOF', 28, '28\'-0"'],
  ].forEach(([name, e, label]) => {
    const y = gl + (e as number) * s;
    ops.push(line(x0 - 44, y, x0 - 2, y, { width: 0.3, color: GREY }));
    ops.push(text(x0 - 44, y + 3, `${name} ${label}`, { size: 5.5 }));
  });
  ops.push(text(x0 - 44, gl - 5.2 * s - 8, 'T/FOOTING -5\'-2"', { size: 5.5 }));
  // grid bubbles on top
  GRID_X.forEach((gx, i) => {
    ops.push(
      line(x0 + gx * s, gl + 31 * s + 4, x0 + gx * s, gl + 31 * s + 26, {
        color: GREY,
        width: 0.35,
        dash: [14, 3, 2, 3],
      })
    );
    ops.push(bubble(x0 + gx * s, gl + 31 * s + 36, String(i + 1)));
  });
  ops.push(leader(x0 + 92 * s, gl + 7 * s, x0 + 78 * s, gl + 20 * s, 'Stair 1'));
  ops.push(text(x0 + 56 * s, gl + 26.6 * s, 'Roof deck and membrane', { size: 6 }));
  ops.push(drawingTitle(x0, gl - 110, 'A', 'Building section, looking north', '3/32" = 1\'-0"'));

  // wall section at 3/4" = 1'-0" (54 pt per foot would not fit; shown at 40 pt per foot)
  const wx = 880;
  const top = 700;
  const bottom = 250;
  const layers: [string, number, Color][] = [
    ['Face brick, 3-5/8 in.', 14, '#d4b3a3'],
    ['1 in. air space', 4, '#ffffff'],
    ['2 in. rigid insulation', 8, '#f3e9a3'],
    ['5/8 in. sheathing', 3, '#c4c4c4'],
    ['6 in. steel stud at 16 in. o.c.', 20, '#ffffff'],
    ['5/8 in. gypsum board', 3, '#e2e2e2'],
  ];
  let lx = wx;
  const centres: number[] = [];
  layers.forEach(([, width, color]) => {
    ops.push(
      rect(lx, bottom + 24, width, top - bottom - 24, { fill: color, stroke: INK, lineWidth: 0.7 })
    );
    centres.push(lx + width / 2);
    lx += width;
  });
  // studs hint
  ops.push(hatch(wx + 14 + 4 + 8 + 3, bottom + 24, 20, top - bottom - 24, 14, '#bbbbbb', 0.4));
  // floor slab and edge angle
  ops.push(rect(wx + 21, bottom, 150, 24, { fill: '#f2f2f2', stroke: INK, lineWidth: 0.8 }));
  const zig: Pt[] = [];
  for (let i = 0; i < 8; i += 1) {
    const x = wx + 21 + i * 18;
    zig.push(
      [x, bottom + 4],
      [x + 4, bottom + 12 - 8],
      [x + 12, bottom + 4 - 4],
      [x + 16, bottom + 4]
    );
  }
  ops.push(poly(zig, { width: 0.8 }));
  ops.push(rect(wx + 14, bottom - 4, 7, 32, { fill: '#555555' }));
  // coping at the top
  ops.push(
    poly(
      [
        [wx - 3, top],
        [wx + 52, top],
        [wx + 52, top + 6],
        [wx - 3, top + 6],
      ],
      { close: true, fill: '#8f8f8f', width: 0.8 }
    )
  );
  ops.push(text(wx + 60, top + 1, 'Metal coping', { size: 6.5 }));
  layers.forEach(([name], i) => {
    ops.push(leader(centres[i], top - 40 - i * 70, wx + 70, top - 40 - i * 70, name));
  });
  ops.push(leader(wx + 120, bottom + 12, wx + 180, bottom + 54, '3-1/4 in. slab on 3 in. deck'));
  ops.push(leader(wx + 17, bottom + 6, wx + 70, bottom - 14, 'Edge angle, see S-301'));
  ops.push(text(wx - 40, top - 120, 'EXTERIOR', { size: 6, font: 'sansBold', color: '#555555' }));
  ops.push(text(wx + 70, top - 340, 'INTERIOR', { size: 6, font: 'sansBold', color: '#555555' }));
  ops.push(
    drawingTitle(wx - 30, bottom - 36, 'B', 'Typical wall section', '3/4" = 1\'-0", partial height')
  );
  return sheet(info('A-301'), ops);
}

/* --------------------------- structural sheets --------------------------- */

function columnMarks(size = 1.4) {
  return GRID_X.flatMap((gx) =>
    GRID_Y.map((gy) =>
      rect(px(gx) - (size * S) / 2, py(gy) - (size * S) / 2, size * S, size * S, { fill: INK })
    )
  ).join('\n');
}

function foundationSheet(): StoryPage {
  const ops: string[] = [gridAndDims()];
  const footing = (gx: number, gy: number) => {
    const corner = (gx === 0 || gx === BW) && (gy === 0 || gy === BD);
    const edge = gx === 0 || gx === BW || gy === 0 || gy === BD;
    const mark = corner ? 'F1' : edge ? 'F2' : 'F3';
    const size = corner ? 5 : edge ? 6.5 : 8;
    return [
      rect(px(gx) - (size * S) / 2, py(gy) - (size * S) / 2, size * S, size * S, {
        fill: '#f4f4f4',
        stroke: INK,
        lineWidth: 0.9,
      }),
      text(px(gx) + (size * S) / 2 - 18, py(gy) - (size * S) / 2 + 3, mark, {
        size: 6.5,
        font: 'sansBold',
      }),
    ].join('\n');
  };
  // slab outline and foundation walls
  ops.push(rect(px(0), py(0), BW * S, BD * S, { fill: PAPER_TINT }));
  ops.push(hatch(px(0), py(0), BW * S, BD * S, 7, '#d4d4d4', 0.25));
  // strip footing (hidden lines) under the perimeter
  ops.push(
    rect(px(-1.4), py(-1.4), (BW + 2.8) * S, (BD + 2.8) * S, { stroke: GREY, lineWidth: 0.7 })
  );
  ops.push(
    poly(
      [
        [px(1.4), py(1.4)],
        [px(BW - 1.4), py(1.4)],
        [px(BW - 1.4), py(BD - 1.4)],
        [px(1.4), py(BD - 1.4)],
      ],
      { close: true, color: GREY, width: 0.7, dash: [4, 2] }
    )
  );
  ops.push(
    rect(px(-0.4), py(-0.4), (BW + 0.8) * S, (BD + 0.8) * S, { stroke: INK, lineWidth: 1.3 })
  );
  ops.push(rect(px(0.5), py(0.5), (BW - 1) * S, (BD - 1) * S, { stroke: INK, lineWidth: 1.3 }));
  GRID_X.forEach((gx) => GRID_Y.forEach((gy) => ops.push(footing(gx, gy))));
  ops.push(columnMarks(1.5));
  // elevator pit
  ops.push(
    rect(px(97), py(34.5), 6.5 * S, 8 * S, { fill: '#ffffff', stroke: INK, lineWidth: 1.2 })
  );
  ops.push(line(px(97), py(34.5), px(103.5), py(42.5), { width: 0.5 }));
  ops.push(line(px(97), py(42.5), px(103.5), py(34.5), { width: 0.5 }));
  ops.push(leader(px(98), py(38.5), px(86), py(52), 'Elevator pit, T/SLAB -4\'-6"'));
  // slab joints
  [13, 39, 65, 91].forEach((x) =>
    ops.push(
      line(px(x), py(1.2), px(x), py(BD - 1.2), { color: '#888888', width: 0.5, dash: [3, 3] })
    )
  );
  ops.push(text(px(14) + 3, py(48), 'CONTROL JOINT, TYP.', { size: 5.5, color: '#555555' }));
  // section markers
  ops.push(
    line(px(0) - 49, py(15), px(BW) + 49, py(15), { color: INK, width: 0.8, dash: [10, 3, 2, 3] })
  );
  ops.push(sectionMarker(px(0) - 58, py(15), '1', 'S-301', 'right'));
  ops.push(sectionMarker(px(BW) + 58, py(15), '1', 'S-301', 'left'));
  ops.push(
    leader(px(26) + 24, py(30) - 34, px(26) + 70, py(30) - 100 + 40, 'Spread footing, see schedule')
  );
  ops.push(drawingTitle(px(0), py(0) - 100, '1', 'Foundation plan', '1/8" = 1\'-0"'));
  ops.push(northArrow(px(0) + 330, py(0) - 96));
  ops.push(scaleBar(px(0) + 400, py(0) - 92, S));

  ops.push(text(px(BW) + 98, py(BD) + 70, 'FOOTING SCHEDULE', { size: 8, font: 'sansBold' }));
  ops.push(
    table(
      px(BW) + 98,
      py(BD) + 62,
      [30, 54, 60],
      [
        ['Mark', 'Size', 'Reinforcing'],
        ['F1', '5\'-0" sq x 1\'-8"', '(6) #5 each way'],
        ['F2', '6\'-6" sq x 1\'-8"', '(7) #5 each way'],
        ['F3', '8\'-0" sq x 2\'-0"', '(9) #6 each way'],
        ['WF', '2\'-0" x 1\'-0"', '(3) #5 continuous'],
      ],
      { rowHeight: 17, size: 5.8 }
    )
  );
  const gen = keyNotes(
    px(BW) + 98,
    py(BD) - 36,
    'Foundation notes',
    [
      'Design soil bearing 3,000 psf. Geotechnical report by Tillman Soils, 14 August 2026.',
      'Concrete 4,000 psi at 28 days, reinforcing ASTM A615 grade 60.',
      'Bear footings on undisturbed soil at least 30 in. below grade.',
      'Slab on grade: 5 in. over 4 in. gravel and a vapour retarder.',
      'Anchor bolts to match the column base plate detail on S-301.',
    ],
    144
  );
  ops.push(gen.ops);
  return sheet(info('S-101'), ops);
}

function framingSheet(): StoryPage {
  const ops: string[] = [gridAndDims()];
  // pour areas
  const pour1: Pt[] = [
    [0, 0],
    [52, 0],
    [52, 60],
    [0, 60],
  ];
  const pour2: Pt[] = [
    [52, 0],
    [104, 0],
    [104, 34],
    [86, 34],
    [86, 60],
    [52, 60],
  ];
  const toPt = (pts: Pt[]) => pts.map(([x, y]) => [px(x), py(y)] as Pt);
  ops.push(poly(toPt(pour1), { fill: '#ffeaa0', width: 0 }));
  ops.push(poly(toPt(pour2), { fill: '#d8e7f5', width: 0 }));
  // stair and elevator opening
  ops.push(rect(px(86), py(34), 18 * S, 26 * S, { fill: '#ffffff' }));
  ops.push(line(px(86), py(34), px(104), py(60), { width: 0.6 }));
  ops.push(line(px(86), py(60), px(104), py(34), { width: 0.6 }));
  ops.push(rect(px(95) - 36, py(47) - 11, 72, 24, { fill: '#ffffff' }));
  ops.push(centered(px(95), py(47) + 3, 'OPENING', 6.5, 'sansBold'));
  ops.push(centered(px(95), py(47) - 6, 'STAIR 1 AND E1', 5.5));
  // perimeter slab edge
  ops.push(rect(px(0), py(0), BW * S, BD * S, { stroke: INK, lineWidth: 1.4 }));
  // beams between girders, 8'-8" o.c.
  GRID_X.slice(0, -1).forEach((gx, bay) => {
    [8.667, 17.333].forEach((offset, i) => {
      const x = gx + offset;
      const yTop = x > 86 ? 34 : 60;
      ops.push(line(px(x), py(0), px(x), py(30), { width: 0.8 }));
      if (yTop === 60) {
        ops.push(line(px(x), py(30), px(x), py(60), { width: 0.8 }));
      } else {
        ops.push(line(px(x), py(30), px(x), py(34), { width: 0.8 }));
      }
      if (bay === 0 && i === 0) {
        ops.push(textRot(px(x) - 2, py(8), 'W16x26 [24 STUDS]', 5.8));
      }
    });
  });
  // girders along A, B, C
  GRID_Y.forEach((gy) => {
    GRID_X.slice(0, -1).forEach((gx, i) => {
      ops.push(line(px(gx), py(gy), px(GRID_X[i + 1]), py(gy), { width: 2.6 }));
      ops.push(
        centered(
          px(gx + 13),
          py(gy) + (gy === 60 ? -8 : 4),
          gy === 30 ? 'W21x44' : 'W18x35',
          6,
          'sansBold'
        )
      );
    });
  });
  // edge beams along 1 and 5
  [0, 104].forEach((gx) => {
    ops.push(line(px(gx), py(0), px(gx), py(60), { width: 2.6 }));
    ops.push(textRot(px(gx) + (gx === 0 ? 4 : -5), py(12), 'W18x35', 6, 'sansBold'));
  });
  [26, 52, 78].forEach((gx) => {
    ops.push(line(px(gx), py(0), px(gx), py(60), { width: 2.2 }));
    ops.push(textRot(px(gx) + 4, py(19), 'W18x35', 6, 'sansBold'));
  });
  ops.push(columnMarks(1.5));
  // pour joint
  ops.push(
    line(px(52), py(-4), px(52), py(BD + 4), { color: '#d4351c', width: 1.4, dash: [8, 3] })
  );
  ops.push(
    text(px(52) + 4, py(BD) + 6, 'POUR JOINT', { size: 6, font: 'sansBold', color: '#d4351c' })
  );
  // pour tags
  const tag = (x: number, y: number, n: string, area: string, volume: string) =>
    [
      rect(px(x) - 52, py(y) - 20, 104, 40, { fill: '#ffffff', stroke: INK, lineWidth: 1.2 }),
      centered(px(x), py(y) + 6, `POUR ${n}`, 11, 'sansBold'),
      centered(px(x), py(y) - 5, area, 6.5),
      centered(px(x), py(y) - 14, volume, 6.5),
    ].join('\n');
  ops.push(tag(26, 45, '1', '3,120 sq ft', '48 cu yd'));
  ops.push(tag(70, 17, '2', '2,652 sq ft', '41 cu yd'));
  ops.push(text(px(34), py(24) - 4, 'Pour 1 first', { size: 6, color: '#555555' }));
  ops.push(drawingTitle(px(0), py(0) - 100, '1', 'Level 2 framing and pour plan', '1/8" = 1\'-0"'));
  ops.push(northArrow(px(0) + 330, py(0) - 96));
  ops.push(scaleBar(px(0) + 400, py(0) - 92, S));

  const pourNotes = keyNotes(
    px(BW) + 98,
    py(BD) + 70,
    'Slab pour notes',
    [
      'Composite slab: 3 in. deep 20 gauge deck with 3-1/4 in. lightweight concrete, 4,000 psi.',
      'Pour 1 first, then Pour 2. Leave at least 24 hours between pours.',
      'Stop the pour at the pour joint, over a beam. Install a bulkhead.',
      'Special inspector present for the full pour. Slump 4 to 6 in.',
      'Shore the deck at midspan until the concrete reaches 75 percent strength.',
      'Studs 3/4 in. diameter, 5 in. long. Quantity in brackets is per beam.',
    ],
    144
  );
  ops.push(pourNotes.ops);
  return sheet(info('S-201'), ops);
}

function ibeam(
  cx: number,
  y: number,
  w: number,
  h: number,
  tf: number,
  tw: number,
  color: Color = '#d8d8d8'
) {
  const x = cx - w / 2;
  const web = cx - tw / 2;
  const pts: Pt[] = [
    [x, y + h],
    [x + w, y + h],
    [x + w, y + h - tf],
    [web + tw, y + h - tf],
    [web + tw, y + tf],
    [x + w, y + tf],
    [x + w, y],
    [x, y],
    [x, y + tf],
    [web, y + tf],
    [web, y + h - tf],
    [x, y + h - tf],
  ];
  return poly(pts, { close: true, fill: color, width: 0.9 });
}

function detailsSheet(): StoryPage {
  const ops: string[] = [];
  const cw = 380;
  const ch = 285;
  const cells: [number, number][] = [
    [34, 470],
    [420, 470],
    [806, 470],
    [34, 175],
    [420, 175],
    [806, 175],
  ];
  cells.forEach(([x, y], i) => {
    ops.push(rect(x, y, cw - 10, ch - 10, { stroke: LIGHT, lineWidth: 0.8 }));
    void i;
  });
  const title = (i: number, name: string, scale: string) => {
    const [x, y] = cells[i];
    return drawingTitle(x + 12, y + 28, String(i + 1), name, scale);
  };

  // 1 spread footing
  {
    const [x, y] = cells[0];
    const cx = x + 175;
    const base = y + 70;
    ops.push(rect(x + 20, base + 70, 310, 0.1, { stroke: INK, lineWidth: 1.2 }));
    ops.push(hatch(x + 20, base - 10, 310, 80, 6, '#cccccc', 0.25));
    ops.push(rect(cx - 90, base, 180, 40, { fill: '#ffffff', stroke: INK, lineWidth: 1.1 }));
    ops.push(rect(cx - 24, base + 40, 48, 70, { fill: '#ffffff', stroke: INK, lineWidth: 1.1 }));
    [-70, -46, -22, 0, 22, 46, 70].forEach((dx) =>
      ops.push(ellipse(cx + dx, base + 8, 2.2, 2.2, { fill: INK }))
    );
    ops.push(
      poly(
        [
          [cx - 18, base + 108],
          [cx - 18, base + 12],
          [cx - 80, base + 12],
        ],
        { width: 1.4 }
      )
    );
    ops.push(
      poly(
        [
          [cx + 18, base + 108],
          [cx + 18, base + 12],
          [cx + 80, base + 12],
        ],
        { width: 1.4 }
      )
    );
    ops.push(rect(cx - 150, base + 70, 126, 6, { fill: '#e0e0e0', stroke: INK, lineWidth: 0.8 }));
    ops.push(rect(cx + 24, base + 70, 126, 6, { fill: '#e0e0e0', stroke: INK, lineWidth: 0.8 }));
    ops.push(leader(cx + 60, base + 73, cx + 100, base + 100, '5 in. slab on grade'));
    ops.push(leader(cx - 70, base + 8, cx - 56, base - 12, 'Reinforcing, see schedule'));
    ops.push(leader(cx, base + 90, cx + 60, base + 126, 'Dowels to match column bars'));
    ops.push(dimH(cx - 90, cx + 90, base - 36, '6\'-6" F2', base - 4));
    ops.push(title(0, 'Spread footing', '1/2" = 1\'-0"'));
  }
  // 2 slab on grade
  {
    const [x, y] = cells[1];
    const sx = x + 30;
    const base = y + 100;
    const wd = 190;
    ops.push(rect(sx, base + 80, wd, 22, { fill: '#e8e8e8', stroke: INK, lineWidth: 1 }));
    ops.push(
      poly(
        [
          [sx, base + 90],
          [sx + wd, base + 90],
        ],
        { width: 0.7, dash: [6, 2] }
      )
    );
    ops.push(line(sx, base + 80, sx + wd, base + 80, { width: 2 }));
    ops.push(rect(sx, base + 32, wd, 48, { fill: '#f6f6f6', stroke: INK, lineWidth: 0.8 }));
    for (let i = 0; i < 70; i += 1) {
      ops.push(
        ellipse(sx + ((i * 37) % (wd - 4)) + 2, base + 35 + ((i * 17) % 43), 1.2, 1.2, {
          stroke: GREY,
          lineWidth: 0.3,
        })
      );
    }
    ops.push(rect(sx, base, wd, 32, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }));
    ops.push(hatch(sx, base, wd, 32, 6, '#bbbbbb', 0.3));
    ops.push(
      leader(sx + 150, base + 91, sx + wd + 12, base + 130, '5 in. concrete, 6x6 W2.9 mesh')
    );
    ops.push(leader(sx + 120, base + 80, sx + wd + 12, base + 106, '10 mil vapour retarder'));
    ops.push(leader(sx + 150, base + 55, sx + wd + 12, base + 62, '4 in. compacted gravel'));
    ops.push(leader(sx + 150, base + 16, sx + wd + 12, base + 20, 'Compacted subgrade'));
    ops.push(title(1, 'Slab on grade', '1-1/2" = 1\'-0"'));
  }
  // 3 column base
  {
    const [x, y] = cells[2];
    const cx = x + 150;
    const base = y + 70;
    ops.push(rect(cx - 70, base, 140, 80, { fill: '#f4f4f4', stroke: INK, lineWidth: 1 }));
    ops.push(rect(cx - 52, base + 80, 104, 8, { fill: '#c0c0c0', stroke: INK, lineWidth: 0.8 }));
    ops.push(rect(cx - 52, base + 88, 104, 8, { fill: '#7e7e7e', stroke: INK, lineWidth: 0.8 }));
    ops.push(ibeam(cx, base + 96, 56, 92, 7, 5));
    [-44, 44].forEach((dx) => {
      ops.push(line(cx + dx, base + 8, cx + dx, base + 96 + 14, { width: 1.8 }));
      ops.push(rect(cx + dx - 4, base + 96, 8, 3, { fill: INK }));
    });
    ops.push(line(x + 20, base + 80, x + 330, base + 80, { width: 1.6 }));
    ops.push(leader(cx + 52, base + 92, cx + 110, base + 122, '1-1/4 in. base plate'));
    ops.push(leader(cx + 44, base + 40, cx + 110, base + 56, '(4) 3/4 in. anchor rods'));
    ops.push(leader(cx + 52, base + 84, cx + 110, base + 98, 'Non-shrink grout'));
    ops.push(leader(cx + 20, base + 160, cx + 70, base + 176, 'W12x53 column'));
    ops.push(title(2, 'Column base', '3/4" = 1\'-0"'));
  }
  // 4 beam to girder
  {
    const [x, y] = cells[3];
    const gx0 = x + 60;
    const base = y + 70;
    ops.push(rect(gx0, base, 22, 150, { fill: '#e2e2e2', stroke: INK, lineWidth: 1 }));
    ops.push(rect(gx0 + 22, base + 44, 190, 104, { fill: '#e2e2e2', stroke: INK, lineWidth: 1 }));
    ops.push(rect(gx0 + 22, base + 44, 190, 8, { fill: '#cfcfcf', stroke: INK, lineWidth: 0.6 }));
    ops.push(rect(gx0 + 22, base + 140, 190, 8, { fill: '#cfcfcf', stroke: INK, lineWidth: 0.6 }));
    ops.push(rect(gx0 + 22, base + 60, 30, 72, { fill: '#b8b8b8', stroke: INK, lineWidth: 0.9 }));
    [72, 96, 120].forEach((dy) => {
      ops.push(
        ellipse(gx0 + 37, base + dy - 20, 3, 3, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 })
      );
    });
    ops.push(leader(gx0 + 37, base + 76, gx0 + 226, base + 112, '(3) 3/4 in. A325 bolts'));
    ops.push(leader(gx0 + 46, base + 124, gx0 + 226, base + 76, '3/8 in. shear tab'));
    ops.push(text(gx0 + 70, base + 92, 'W16x26 beam', { size: 6.5 }));
    ops.push(text(gx0 - 20, base + 158, 'W21x44 girder, web', { size: 6.5 }));
    ops.push(title(3, 'Beam to girder connection', '1-1/2" = 1\'-0"'));
  }
  // 5 deck edge
  {
    const [x, y] = cells[4];
    const ex = x + 90;
    const base = y + 70;
    ops.push(ibeam(ex + 40, base, 90, 78, 7, 5, '#e2e2e2'));
    // deck profile
    const profile: Pt[] = [];
    for (let i = 0; i < 12; i += 1) {
      const x0 = ex + 42 + i * 18;
      profile.push(
        [x0, base + 78],
        [x0 + 4, base + 90],
        [x0 + 12, base + 90],
        [x0 + 16, base + 78]
      );
    }
    ops.push(poly(profile, { width: 1.1 }));
    ops.push(rect(ex + 42, base + 90, 210, 40, { fill: '#f2f2f2', stroke: INK, lineWidth: 0.9 }));
    ops.push(
      poly(
        [
          [ex + 36, base + 78],
          [ex + 36, base + 140],
          [ex + 42, base + 140],
        ],
        { width: 3 }
      )
    );
    ops.push(line(ex + 42, base + 120, ex + 250, base + 120, { width: 0.7, dash: [5, 2] }));
    ops.push(line(ex + 40, base + 78, ex + 40, base + 100, { width: 1.5 }));
    ops.push(rect(ex + 36.5, base + 78, 1.5, 62, { fill: INK }));
    ops.push(leader(ex + 110, base + 126, ex + 150, base + 156, '3-1/4 in. lightweight concrete'));
    ops.push(leader(ex + 92, base + 84, ex + 150, base + 58, '3 in. composite deck, 20 gauge'));
    ops.push(leader(ex + 36, base + 134, ex + 24, base + 172, 'L4x4x1/4 edge angle'));
    ops.push(leader(ex + 40, base + 36, ex + 120, base + 36, 'W18x35 edge beam'));
    ops.push(title(4, 'Composite slab edge', '1-1/2" = 1\'-0"'));
  }
  // 6 composite beam section
  {
    const [x, y] = cells[5];
    const cx = x + 175;
    const base = y + 70;
    ops.push(rect(cx - 150, base + 110, 300, 44, { fill: '#f2f2f2', stroke: INK, lineWidth: 0.9 }));
    const profile: Pt[] = [];
    for (let i = -8; i < 8; i += 1) {
      const x0 = cx + i * 18;
      profile.push(
        [x0, base + 102],
        [x0 + 4, base + 114],
        [x0 + 12, base + 114],
        [x0 + 16, base + 102]
      );
    }
    ops.push(poly(profile, { width: 1.1 }));
    ops.push(ibeam(cx, base + 10, 70, 92, 8, 5, '#dcdcdc'));
    [-12, 12].forEach((dx) => {
      ops.push(line(cx + dx, base + 102, cx + dx, base + 144, { width: 2.4 }));
      ops.push(ellipse(cx + dx, base + 144, 4, 2, { fill: INK }));
    });
    ops.push(leader(cx + 12, base + 125, cx + 110, base + 175, '3/4 in. headed stud'));
    ops.push(leader(cx + 35, base + 100, cx + 110, base + 78, 'W16x26'));
    ops.push(leader(cx + 90, base + 140, cx + 126, base + 160, 'Welded wire fabric'));
    ops.push(title(5, 'Composite beam', '1-1/2" = 1\'-0"'));
  }
  return sheet(info('S-301'), ops);
}

/* ------------------------- mechanical and electrical ------------------------- */

function duct(x1: number, y1: number, x2: number, y2: number, widthFt: number, label?: string) {
  const horizontal = Math.abs(y2 - y1) < 1e-6;
  const w = widthFt * S;
  const ops: string[] = [];
  if (horizontal) {
    ops.push(
      rect(px(Math.min(x1, x2)), py(y1) - w / 2, Math.abs(x2 - x1) * S, w, {
        fill: '#ffffff',
        stroke: INK,
        lineWidth: 0.9,
      })
    );
    if (label) {
      ops.push(centered(px((x1 + x2) / 2), py(y1) - 1.8, label, 5.2, 'sansBold'));
    }
  } else {
    ops.push(
      rect(px(x1) - w / 2, py(Math.min(y1, y2)), w, Math.abs(y2 - y1) * S, {
        fill: '#ffffff',
        stroke: INK,
        lineWidth: 0.9,
      })
    );
  }
  return ops.join('\n');
}

function diffuser(x: number, y: number, size = 2) {
  const s = size * S;
  return [
    rect(px(x) - s / 2, py(y) - s / 2, s, s, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }),
    line(px(x) - s / 2, py(y) - s / 2, px(x) + s / 2, py(y) + s / 2, { width: 0.5 }),
    line(px(x) - s / 2, py(y) + s / 2, px(x) + s / 2, py(y) - s / 2, { width: 0.5 }),
  ].join('\n');
}

function mechanicalSheet(): StoryPage {
  const ops: string[] = [gridAndDims({ topDims: false }), planBase(PLAN_1, true)];
  // supply trunk along the corridor
  ops.push(duct(84, 30, 98, 30, 2, '24x14'));
  ops.push(duct(52, 30, 84, 30, 1.7, '20x12'));
  ops.push(duct(8, 30, 52, 30, 1.2, '14x10'));
  // branches
  const south: [number, number][] = [
    [20, 12],
    [60, 13],
    [76, 13],
    [94, 13],
  ];
  const north: [number, number][] = [
    [10, 47],
    [29, 47],
    [48, 47],
    [63, 47],
    [73, 47],
  ];
  south.forEach(([x, y]) => {
    ops.push(duct(x, 26.6, x, 30, 0.8));
    ops.push(duct(x, y, x, 26.6, 0.8));
    ops.push(diffuser(x, y));
  });
  north.forEach(([x, y]) => {
    ops.push(duct(x, 33.4, x, 30, 0.8));
    ops.push(duct(x, 33.4, x, y, 0.8));
    ops.push(diffuser(x, y));
  });
  // lobby gets two
  ops.push(duct(30, 30, 30, 26.6, 0.8), duct(30, 26.6, 30, 12, 0.8), diffuser(30, 12));
  ops.push(duct(8, 26.6, 8, 12, 0.8), diffuser(8, 12));
  // VAV boxes
  [
    ['VAV-1', 44, 30],
    ['VAV-2', 64, 30],
    ['VAV-3', 90, 30],
  ].forEach(([name, x, y]) => {
    ops.push(
      rect(px(x as number) - 14, py(y as number) - 8, 28, 16, {
        fill: '#e8e8e8',
        stroke: INK,
        lineWidth: 0.9,
      })
    );
    ops.push(centered(px(x as number), py(y as number) - 2, name as string, 5.4, 'sansBold'));
  });
  // supply riser from RTU
  ops.push(ellipse(px(99), py(30), 8, 8, { fill: '#ffffff', stroke: INK, lineWidth: 1 }));
  ops.push(line(px(99) - 5.6, py(30) - 5.6, px(99) + 5.6, py(30) + 5.6, { width: 0.7 }));
  ops.push(line(px(99) - 5.6, py(30) + 5.6, px(99) + 5.6, py(30) - 5.6, { width: 0.7 }));
  ops.push(leader(px(99) + 6, py(30) + 6, px(99) + 38, py(30) + 70, 'Supply riser from RTU-1'));
  // return grilles in corridor ceiling
  [14, 38, 70].forEach((x) => {
    ops.push(
      rect(px(x) - 8, py(31.9) - 3, 16, 6, { fill: '#ffffff', stroke: INK, lineWidth: 0.7 })
    );
    ops.push(line(px(x) - 8, py(31.9), px(x) + 8, py(31.9), { width: 0.4 }));
  });
  ops.push(leader(px(38), py(31.9) + 3, px(38) + 6, py(31.9) + 44, 'Return grille 24x12'));
  // thermostats
  [
    [51.5, 12],
    [67.5, 12],
    [83.5, 12],
    [43, 40],
    [56, 52],
  ].forEach(([x, y]) => {
    ops.push(ellipse(px(x), py(y), 4.2, 4.2, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }));
    ops.push(centered(px(x), py(y) - 2.2, 'T', 6, 'sansBold'));
  });
  // exhaust from the toilets
  ops.push(rect(px(64) - 6, py(57) - 4, 12, 8, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }));
  ops.push(text(px(64) - 5, py(57) - 2.2, 'EF-1', { size: 5, font: 'sansBold' }));
  ops.push(drawingTitle(px(0), py(0) - 100, '1', 'Level 1 mechanical plan', '1/8" = 1\'-0"'));
  ops.push(northArrow(px(0) + 330, py(0) - 96));
  ops.push(scaleBar(px(0) + 400, py(0) - 92, S));

  ops.push(text(px(BW) + 98, py(BD) + 70, 'EQUIPMENT SCHEDULE', { size: 8, font: 'sansBold' }));
  ops.push(
    table(
      px(BW) + 98,
      py(BD) + 62,
      [34, 52, 58],
      [
        ['Mark', 'Type', 'Capacity'],
        ['RTU-1', 'Rooftop unit', '15 tons, 6,000 cfm'],
        ['VAV-1', 'VAV box', '1,200 cfm'],
        ['VAV-2', 'VAV box', '1,500 cfm'],
        ['VAV-3', 'VAV box', '900 cfm'],
        ['EF-1', 'Exhaust fan', '320 cfm'],
      ],
      { rowHeight: 16, size: 5.8 }
    )
  );
  const mnotes = keyNotes(
    px(BW) + 98,
    py(BD) - 52,
    'Mechanical notes',
    [
      'Duct sizes are inside clear dimensions, width x height.',
      'Coordinate ceiling diffusers with the reflected ceiling plan.',
      'Supply duct above corridor ceiling at 10 ft above floor.',
      'Provide fire dampers where ducts pass through rated walls.',
    ],
    144
  );
  ops.push(mnotes.ops);
  return sheet(info('M-101'), ops);
}

function electricalSheet(): StoryPage {
  const ops: string[] = [gridAndDims({ topDims: false }), planBase(PLAN_1, true)];
  // troffers: 2x4 in a grid per room
  PLAN_1.rooms.forEach((room) => {
    if (room.name.startsWith('Stair') || room.name === 'Elevator') {
      return;
    }
    const w = room.x2 - room.x1;
    const cols = Math.max(1, Math.round(w / 9));
    const rows = room.y2 - room.y1 > 20 ? 2 : 1;
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const lx = room.x1 + ((c + 0.5) * w) / cols;
        const ly = room.y1 + ((r + 0.5) * (room.y2 - room.y1)) / rows;
        ops.push(
          rect(px(lx) - 7.5, py(ly) - 3.75, 15, 7.5, {
            fill: '#ffffff',
            stroke: INK,
            lineWidth: 0.7,
          })
        );
        ops.push(line(px(lx) - 7.5, py(ly), px(lx) + 7.5, py(ly), { width: 0.4 }));
      }
    }
  });
  // corridor lights
  [10, 26, 42, 58, 74, 90].forEach((x) => {
    ops.push(ellipse(px(x), py(30), 3.4, 3.4, { fill: '#ffffff', stroke: INK, lineWidth: 0.7 }));
    ops.push(line(px(x) - 2.4, py(30) - 2.4, px(x) + 2.4, py(30) + 2.4, { width: 0.4 }));
  });
  // switches next to doors
  [
    [38.8, 25.2],
    [55.2, 25.2],
    [71.2, 25.2],
    [87.2, 25.2],
    [7.2, 34.8],
    [27.2, 34.8],
    [43.2, 34.8],
    [60.2, 34.8],
    [70.2, 34.8],
  ].forEach(([x, y]) => ops.push(centered(px(x), py(y) - 2.2, '$', 7, 'sansBold')));
  // duplex receptacles
  const outlets: [number, number][] = [
    [2, 6],
    [2, 20],
    [14, 0.8],
    [30, 25.2],
    [50, 12],
    [53.2, 20],
    [69.2, 6],
    [85.2, 20],
    [101.8, 18],
    [101.8, 5],
    [2, 38],
    [2, 52],
    [18.8, 50],
    [36.8, 50],
    [39.2, 45],
    [57.2, 52],
    [76.8, 52],
    [84.8, 44],
    [12, 59.2],
    [30, 59.2],
    [47, 59.2],
  ];
  outlets.forEach(([x, y]) => {
    ops.push(ellipse(px(x), py(y), 2.8, 2.8, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }));
    ops.push(line(px(x) - 2.8, py(y), px(x) + 2.8, py(y), { width: 0.5 }));
  });
  // panel in IT closet
  ops.push(rect(px(80), py(57.2), 9, 14, { fill: INK }));
  ops.push(text(px(80) + 12, py(57.2) - 8, 'LP-1', { size: 6.5, font: 'sansBold' }));
  // home runs to the panel, dashed with arrows
  const run = (pts: [number, number][], label: string, lx: number, ly: number) => {
    ops.push(
      poly(
        pts.map(([x, y]) => [px(x), py(y)] as Pt),
        { width: 0.8, dash: [4, 2] }
      )
    );
    ops.push(text(px(lx), py(ly), label, { size: 5.5, font: 'sansBold' }));
  };
  run(
    [
      [80.5, 56],
      [80.5, 32.6],
      [48, 32.6],
      [48, 44],
    ],
    'LP-1: 1, 3',
    52,
    33.3
  );
  run(
    [
      [84, 56],
      [84, 31],
      [62, 31],
      [62, 12],
    ],
    'LP-1: 5, 7',
    64,
    27.6
  );
  run(
    [
      [82.2, 56],
      [82.2, 33.4],
      [22, 33.4],
      [22, 46],
    ],
    'LP-1: 9',
    26,
    29.6
  );
  // exit signs
  [
    [17, 3],
    [1.4, 29.5],
  ].forEach(([x, y]) => {
    ops.push(rect(px(x) - 8, py(y) - 3.5, 16, 7, { fill: INK }));
    ops.push(centered(px(x), py(y) - 1.6, 'EXIT', 4.6, 'sansBold', '#ffffff'));
  });
  ops.push(
    drawingTitle(px(0), py(0) - 100, '1', 'Level 1 lighting and power plan', '1/8" = 1\'-0"')
  );
  ops.push(northArrow(px(0) + 330, py(0) - 96));
  ops.push(scaleBar(px(0) + 400, py(0) - 92, S));

  // legend
  const lx = px(BW) + 98;
  const ly = py(BD) + 70;
  ops.push(text(lx, ly, 'LEGEND', { size: 8, font: 'sansBold' }));
  ops.push(line(lx, ly - 4, lx + 144, ly - 4, { width: 0.8 }));
  const entries: [() => string, string][] = [
    [
      () =>
        [
          rect(lx + 2, ly - 30, 15, 7.5, { fill: '#ffffff', stroke: INK, lineWidth: 0.7 }),
          line(lx + 2, ly - 26, lx + 17, ly - 26, { width: 0.4 }),
        ].join('\n'),
      '2x4 recessed LED troffer',
    ],
    [
      () =>
        [
          ellipse(lx + 10, ly - 44, 3.4, 3.4, { fill: '#ffffff', stroke: INK, lineWidth: 0.7 }),
          line(lx + 7.6, ly - 46.4, lx + 12.4, ly - 41.6, { width: 0.4 }),
        ].join('\n'),
      'Downlight',
    ],
    [() => centered(lx + 10, ly - 60, '$', 8, 'sansBold'), 'Wall switch'],
    [
      () =>
        [
          ellipse(lx + 10, ly - 74, 2.8, 2.8, { fill: '#ffffff', stroke: INK, lineWidth: 0.8 }),
          line(lx + 7.2, ly - 74, lx + 12.8, ly - 74, { width: 0.5 }),
        ].join('\n'),
      'Duplex receptacle',
    ],
    [
      () =>
        [
          rect(lx + 2, ly - 92, 16, 7, { fill: INK }),
          centered(lx + 10, ly - 90.4, 'EXIT', 4.6, 'sansBold', '#ffffff'),
        ].join('\n'),
      'Illuminated exit sign',
    ],
    [
      () =>
        poly(
          [
            [lx + 2, ly - 104],
            [lx + 18, ly - 104],
          ],
          { width: 0.8, dash: [4, 2] }
        ),
      'Home run to panel',
    ],
  ];
  entries.forEach(([draw, label], i) => {
    ops.push(draw());
    ops.push(text(lx + 28, ly - 28 - i * 15 - (i > 3 ? 2 : 0), label, { size: 6.5 }));
  });
  ops.push(
    table(
      lx,
      ly - 126,
      [34, 50, 60],
      [
        ['Panel', 'Rating', 'Location'],
        ['LP-1', '225 A, 120/208 V', 'IT 110'],
        ['LP-2', '100 A, 120/208 V', 'Level 2 IT'],
      ],
      { rowHeight: 16, size: 5.8 }
    )
  );
  const enotes = keyNotes(
    lx,
    ly - 196,
    'Electrical notes',
    [
      'Mount receptacles at 18 in. to centre unless noted.',
      'Emergency lighting on a 90 minute battery backup.',
      'Provide GFCI protection at all receptacles within 6 ft of a sink.',
    ],
    144
  );
  ops.push(enotes.ops);
  return sheet(info('E-101'), ops);
}

/* ---------------------------------- source ---------------------------------- */

const source: StoryPdfSource = {
  fileName: 'plan-set.pdf',
  build: () => ({
    title: 'Millbrook Medical Office, construction documents',
    author: 'Okafor Lindqvist Architects',
    subject: 'Issued for construction, 12 October 2026',
    outline: SHEETS.map((s, index) => ({ title: `${s.number}  ${s.title}`, page: index + 1 })),
    pages: [
      coverSheet(),
      floorSheet(1),
      floorSheet(2),
      elevationsSheet(),
      sectionsSheet(),
      foundationSheet(),
      framingSheet(),
      detailsSheet(),
      mechanicalSheet(),
      electricalSheet(),
    ],
  }),
};

export default source;
