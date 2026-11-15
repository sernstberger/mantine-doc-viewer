/** E-ticket PDF for the Gate (airline app) story: a boarding pass, the receipt and the baggage rules */
import {
  ellipse,
  line,
  paragraph,
  rect,
  StoryPage,
  StoryPdf,
  StoryPdfSource,
  text,
} from './pdf-writer';

const W = 360;
const NAVY = '#0B2545';
const MIST = '#EEF4FA';
const AMBER = '#F4B400';
const INK = '#14213A';
const GREY = '#5E6F86';
const RULE = '#D5DEE9';

/** Helvetica advance estimate, enough to right-align and centre short strings */
const width = (value: string, size: number, bold = false) =>
  value.length * size * (bold ? 0.62 : 0.55);

const right = (x: number, y: number, value: string, size: number, color: string, bold = false) =>
  text(x - width(value, size, bold), y, value, { size, font: bold ? 'sansBold' : 'sans', color });

const centre = (cx: number, y: number, value: string, size: number, color: string, bold = false) =>
  text(cx - width(value, size, bold) / 2, y, value, {
    size,
    font: bold ? 'sansBold' : 'sans',
    color,
  });

/** The airline's mark: a rounded sun disc with a rising chevron, drawn from paths */
function mark(x: number, y: number, size: number) {
  const s = size / 20;
  return [
    ellipse(x + 10 * s, y + 10 * s, 10 * s, 10 * s, { fill: AMBER }),
    `0.043 0.145 0.271 rg ${x + 4 * s} ${y + 6 * s} m ${x + 10 * s} ${y + 13.5 * s} l ${x + 16 * s} ${y + 6 * s} l ${x + 13.6 * s} ${y + 6 * s} l ${x + 10 * s} ${y + 10.6 * s} l ${x + 6.4 * s} ${y + 6 * s} h f`,
  ].join('\n');
}

function banner(height: number, top: number, title: string) {
  return [
    rect(0, height - top, W, top, { fill: NAVY }),
    mark(20, height - top + (top - 22) / 2, 22),
    text(50, height - top / 2 - 4, 'Seabright Air', {
      size: 14,
      font: 'sansBold',
      color: '#FFFFFF',
    }),
    right(W - 20, height - top / 2 - 3.5, title, 10.5, '#B9CAE0'),
  ].join('\n');
}

/** A label above a value, both anchored on the top of the pair */
function field(x: number, height: number, top: number, label: string, value: string, color = INK) {
  return [
    text(x, height - top, label, { size: 8, color: GREY }),
    text(x, height - top - 16, value, { size: 15, font: 'sansBold', color }),
  ].join('\n');
}

/** A QR-like module grid: three finder squares and deterministic noise, not a scannable code */
function qrBlock(x: number, y: number, modules: number, cell: number, seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const inFinder = (cx: number, cy: number) =>
    (cx < 8 && cy < 8) || (cx >= modules - 8 && cy < 8) || (cx < 8 && cy >= modules - 8);
  const finder = (cx: number, cy: number) => {
    const fx = cx < 8 ? cx : cx - (modules - 8);
    const fy = cy < 8 ? cy : cy - (modules - 8);
    if (fx === 7 || fy === 7 || fx < 0 || fy < 0) {
      return false;
    }
    const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
    return ring === 3 || ring <= 1;
  };
  const ops: string[] = [];
  for (let row = 0; row < modules; row += 1) {
    let runStart = -1;
    for (let col = 0; col <= modules; col += 1) {
      const dark =
        col < modules &&
        (inFinder(col, row)
          ? finder(col, row)
          : row === 6 || col === 6
            ? (row + col) % 2 === 0
            : next() > 0.52);
      if (dark && runStart < 0) {
        runStart = col;
      }
      if (!dark && runStart >= 0) {
        ops.push(
          rect(x + runStart * cell, y + (modules - 1 - row) * cell, (col - runStart) * cell, cell, {
            fill: NAVY,
          })
        );
        runStart = -1;
      }
    }
  }
  return ops.join('\n');
}

/** Dashed perforation with a notch cut out of each side of the card */
function perforation(height: number, top: number, inset: number) {
  const y = height - top;
  return [
    line(inset + 14, y, W - inset - 14, y, { color: '#B8C6D8', width: 1, dash: [3, 3] }),
    ellipse(inset, y, 9, 9, { fill: MIST }),
    ellipse(W - inset, y, 9, 9, { fill: MIST }),
  ].join('\n');
}

/* ----------------------------------- pages ----------------------------------- */

function boardingPass(): StoryPage {
  const H = 424;
  const inset = 12;
  const cardW = W - inset * 2;
  const tile = 176;
  const tileX = (W - tile) / 2;
  const cell = 5.6;
  const ops = [
    rect(0, 0, W, H, { fill: MIST }),
    rect(inset, inset, cardW, H - inset * 2, { fill: '#FFFFFF' }),
    // the navy head sits inside the card
    rect(inset, H - inset - 48, cardW, 48, { fill: NAVY }),
    mark(inset + 18, H - inset - 35, 22),
    text(inset + 48, H - inset - 29, 'Seabright Air', {
      size: 14,
      font: 'sansBold',
      color: '#FFFFFF',
    }),
    right(W - inset - 18, H - inset - 28.5, 'Boarding pass', 10.5, '#B9CAE0'),

    // passenger and flight
    field(32, H, 84, 'Passenger', 'Ines Marques'),
    right(W - 32, H - 84, 'Flight', 8, GREY),
    right(W - 32, H - 100, 'SB 482', 15, INK, true),

    // the code, framed in a mist tile
    rect(tileX, H - 112 - tile, tile, tile, { fill: MIST }),
    qrBlock(tileX + (tile - 25 * cell) / 2, H - 112 - tile + (tile - 25 * cell) / 2, 25, cell, 482),
    centre(W / 2, H - 124 - tile - 4, 'Hold this code to the reader at the gate', 9, GREY),

    perforation(H, 322, inset),

    // trip details
    field(32, H, 346, 'Gate', 'B34', '#B07E00'),
    field(112, H, 346, 'Boards', '09:05'),
    field(192, H, 346, 'Group', '3'),
    field(262, H, 346, 'Seat', '14A'),
    line(32, H - 374, W - 32, H - 374, { color: RULE, width: 0.8 }),
    text(32, H - 392, 'Lisbon LIS 09:40  to  Copenhagen CPH 14:05, Tue 18 Nov 2026', {
      size: 9,
      color: GREY,
    }),
  ];
  return { width: W, height: H, content: ops.join('\n') };
}

function receipt(): StoryPage {
  const H = 600;
  const rows: [string, string][] = [
    ['Base fare, Flex', '148.00'],
    ['Carrier surcharge', '24.00'],
    ['Lisbon airport charge (PT)', '21.40'],
    ['Passenger security fee (PT)', '12.30'],
    ['Passenger service charge (DK)', '14.60'],
    ['Seat 14A, front section', '14.00'],
  ];
  const ops = [rect(0, 0, W, H, { fill: '#FFFFFF' }), banner(H, 52, 'E-ticket receipt')];

  ops.push(
    text(24, H - 86, 'Ticket number', { size: 8, color: GREY }),
    text(24, H - 102, '057 2418 8309 21', { size: 15, font: 'sansBold', color: INK }),
    right(W - 24, H - 86, 'Booking reference', 8, GREY),
    right(W - 24, H - 102, 'K7QD4M', 15, INK, true),
    line(24, H - 118, W - 24, H - 118, { color: RULE, width: 0.8 }),
    field(24, H, 136, 'Passenger', 'Marques / Ines Ms'),
    right(W - 24, H - 136, 'Issued', 8, GREY),
    right(W - 24, H - 152, '2 Nov 2026', 15, INK, true),
    line(24, H - 170, W - 24, H - 170, { color: RULE, width: 0.8 }),

    // itinerary
    text(24, H - 192, 'Itinerary', { size: 11, font: 'sansBold', color: NAVY }),
    text(24, H - 212, 'SB 482', { size: 10, font: 'sansBold', color: INK }),
    text(76, H - 212, 'Tue 18 Nov 2026', { size: 10, color: INK }),
    text(24, H - 230, 'Lisbon (LIS), Terminal 1', { size: 10, color: INK }),
    right(W - 24, H - 230, '09:40', 10, INK, true),
    text(24, H - 246, 'Copenhagen (CPH), Terminal 3', { size: 10, color: INK }),
    right(W - 24, H - 246, '14:05', 10, INK, true),
    text(24, H - 264, 'Flex fare, 1 checked bag of 23 kg, changes free until 3 hours before', {
      size: 8.2,
      color: GREY,
    }),
    line(24, H - 280, W - 24, H - 280, { color: RULE, width: 0.8 }),

    // fare
    text(24, H - 302, 'Fare and charges', { size: 11, font: 'sansBold', color: NAVY }),
    right(W - 24, H - 302, 'EUR', 8, GREY)
  );
  rows.forEach(([label, amount], index) => {
    const y = H - 324 - index * 20;
    ops.push(text(24, y, label, { size: 10, color: INK }), right(W - 24, y, amount, 10, INK));
  });
  const totalY = H - 324 - rows.length * 20 - 8;
  ops.push(
    line(24, totalY + 16, W - 24, totalY + 16, { color: NAVY, width: 1.2 }),
    text(24, totalY - 4, 'Total paid', { size: 12, font: 'sansBold', color: NAVY }),
    right(W - 24, totalY - 4, 'EUR 234.30', 12, NAVY, true),
    text(
      24,
      totalY - 24,
      'Paid by Visa ending 2093 on 2 Nov 2026, VAT not applicable on this fare.',
      {
        size: 8.2,
        color: GREY,
      }
    )
  );

  const notes = paragraph(
    24,
    totalY - 62,
    'Show this receipt to the immigration officer if asked for proof of onward travel. Keep it until the end of your trip. Questions about your booking: seabright.example/help or +351 21 000 0482.',
    { size: 8.6, color: GREY, width: W - 48, leading: 12.5 }
  );
  ops.push(notes.ops);
  return { width: W, height: H, content: ops.join('\n') };
}

function baggage(): StoryPage {
  const H = 560;
  const ops = [rect(0, 0, W, H, { fill: '#FFFFFF' }), banner(H, 52, 'Baggage')];
  ops.push(
    text(24, H - 90, 'What you can bring on SB 482', { size: 15, font: 'sansBold', color: INK }),
    text(24, H - 108, 'Flex fare, Lisbon to Copenhagen', { size: 9.5, color: GREY })
  );

  const table: [string, string, string][] = [
    ['Personal item', '40 x 30 x 15 cm', 'Included'],
    ['Cabin bag', '55 x 40 x 23 cm, 8 kg', 'Included'],
    ['Checked bag', '23 kg, 158 cm total', '1 included'],
    ['Extra checked bag', '23 kg', 'EUR 35 online'],
    ['Overweight bag', '24 to 32 kg', 'EUR 30'],
  ];
  const top = 130;
  ops.push(
    line(24, H - top, W - 24, H - top, { color: NAVY, width: 1.2 }),
    text(24, H - top - 16, 'Item', { size: 8.5, font: 'sansBold', color: GREY }),
    text(130, H - top - 16, 'Size and weight', { size: 8.5, font: 'sansBold', color: GREY }),
    right(W - 24, H - top - 16, 'Price', 8.5, GREY, true)
  );
  table.forEach(([item, size, price], index) => {
    const y = H - top - 40 - index * 26;
    ops.push(
      line(24, y + 17, W - 24, y + 17, { color: RULE, width: 0.8 }),
      text(24, y, item, { size: 9.5, font: 'sansBold', color: INK }),
      text(130, y, size, { size: 9.5, color: INK }),
      right(W - 24, y, price, 9.5, INK)
    );
  });
  const afterTable = H - top - 40 - table.length * 26;
  ops.push(line(24, afterTable + 17, W - 24, afterTable + 17, { color: RULE, width: 0.8 }));

  let y = afterTable - 20;
  const section = (heading: string, body: string) => {
    ops.push(text(24, y, heading, { size: 11, font: 'sansBold', color: NAVY }));
    const result = paragraph(24, y - 17, body, {
      size: 9.4,
      color: INK,
      width: W - 48,
      leading: 13.4,
    });
    ops.push(result.ops);
    y = result.y - 12;
  };
  section(
    'Drop bags before the desk closes',
    'Bag drop closes 60 minutes before departure, at 08:40 for SB 482. Bags handed in later travel on the next flight.'
  );
  section(
    'Liquids and batteries',
    'Liquids in the cabin must be in containers of 100 ml or less, in one clear 1 litre bag. Spare lithium batteries and power banks go in the cabin, never in a checked bag.'
  );
  section(
    'Sports and musical instruments',
    'Bikes, skis and instruments up to 32 kg travel as a checked bag for EUR 45. Add them at least 24 hours before departure.'
  );
  return { width: W, height: H, content: ops.join('\n') };
}

const source: StoryPdfSource = {
  fileName: 'boarding-pass.pdf',
  build: (): StoryPdf => ({
    title: 'SB 482 Lisbon to Copenhagen',
    author: 'Seabright Air',
    subject: 'Boarding pass, e-ticket receipt and baggage rules',
    pages: [boardingPass(), receipt(), baggage()],
    outline: [
      { title: 'Boarding pass', page: 1 },
      { title: 'E-ticket receipt', page: 2 },
      { title: 'Baggage', page: 3 },
    ],
  }),
};

export default source;
