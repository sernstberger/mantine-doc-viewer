/**
 * Menu proof for the Proofline (print proof approval) story: front and back of an A5 café menu
 * with 3 mm bleed (148 x 210 mm trim, 154 x 216 mm with bleed). The artwork runs into the bleed,
 * and the proof marks are drawn on top: hatching in the bleed area, a trim line and a dashed
 * safe-area line 5 mm inside the trim. The opening hours on the back sit too close to the trim on
 * purpose, so there is something for the customer to catch.
 */
import {
  ellipse,
  fill,
  line,
  rect,
  StoryPage,
  StoryPdfSource,
  text,
  type FontKey,
} from './pdf-writer';

const MM = 72 / 25.4;
const BLEED = 3 * MM;
const SAFE = 5 * MM;
const W = 148 * MM + 2 * BLEED;
const H = 210 * MM + 2 * BLEED;

const BLUE = '#233a9c';
const BUTTER = '#f6e6a6';
const PAPER = '#fbf4d6';
const SOFT = '#4a5aa8';

const TRIM_LINE = '#e5007d';
const SAFE_LINE = '#00a878';

const f = (value: number) => value.toFixed(2);

/** Helvetica widths, close enough to centre and right-align short strings */
function width(value: string, size: number, bold = false) {
  let units = 0;
  for (const char of value) {
    if (/[0-9£]/.test(char)) {
      units += 0.556;
    } else if (/[.,:'’ ]/.test(char)) {
      units += 0.278;
    } else if (/[A-Z]/.test(char)) {
      units += 0.68;
    } else if (/[ilIjtfr]/.test(char)) {
      units += 0.3;
    } else if (/[mwMW]/.test(char)) {
      units += 0.8;
    } else {
      units += 0.53;
    }
  }
  return units * size * (bold ? 1.1 : 1);
}

function centred(y: number, value: string, size: number, font: FontKey, color: string) {
  const w =
    value.length * size * (font === 'serifBold' ? 0.5 : font === 'serifItalic' ? 0.42 : 0.5);
  return text(W / 2 - w / 2, y, value, { size, font, color });
}

const LEFT = BLEED + SAFE + 22;
const RIGHT = W - BLEED - SAFE - 22;

interface Item {
  name: string;
  price: string;
  note?: string;
}

function list(top: number, items: Item[], colors: { ink: string; soft: string; dots: string }) {
  const ops: string[] = [];
  let y = top;
  items.forEach((item) => {
    ops.push(text(LEFT, y, item.name, { size: 10.5, font: 'sansBold', color: colors.ink }));
    const nameEnd = LEFT + width(item.name, 10.5, true) + 6;
    const priceX = RIGHT - width(item.price, 10.5);
    ops.push(
      line(nameEnd, y + 1.5, priceX - 6, y + 1.5, {
        color: colors.dots,
        width: 0.8,
        dash: [0.6, 2.6],
      })
    );
    ops.push(text(priceX, y, item.price, { size: 10.5, font: 'sansBold', color: colors.ink }));
    if (item.note) {
      ops.push(text(LEFT, y - 11, item.note, { size: 8, color: colors.soft }));
      y -= 34;
    } else {
      y -= 24;
    }
  });
  return { ops, y };
}

function heading(y: number, value: string, color: string, rule: string) {
  return [
    text(LEFT, y, value, { size: 15, font: 'serifBold', color }),
    line(LEFT + value.length * 7.2 + 8, y + 4, RIGHT, y + 4, { color: rule, width: 0.6 }),
  ];
}

/** A small wren: round body, cocked tail, thin legs */
function wren(cx: number, cy: number, color: string, eye: string) {
  return [
    // Tail, cocked up
    `q ${fill(color)} ${f(cx - 20)} ${f(cy - 2)} m ${f(cx - 44)} ${f(cy + 26)} l ${f(cx - 36)} ${f(cy + 30)} l ${f(cx - 30)} ${f(cy + 20)} l ${f(cx - 14)} ${f(cy + 6)} l f Q`,
    ellipse(cx, cy, 25, 19, { fill: color }),
    ellipse(cx + 20, cy + 15, 12, 11, { fill: color }),
    // Beak
    `q ${fill(color)} ${f(cx + 30)} ${f(cy + 19)} m ${f(cx + 46)} ${f(cy + 14)} l ${f(cx + 31)} ${f(cy + 10)} l f Q`,
    ellipse(cx + 23, cy + 18, 2.2, 2.2, { fill: eye }),
    line(cx - 3, cy - 17, cx - 4, cy - 32, { color, width: 1.6 }),
    line(cx + 7, cy - 17, cx + 9, cy - 32, { color, width: 1.6 }),
    line(cx - 8, cy - 32, cx + 3, cy - 32, { color, width: 1.6 }),
    line(cx + 4, cy - 32, cx + 14, cy - 32, { color, width: 1.6 }),
  ].join('\n');
}

/** The proof marks: bleed hatching, trim line and the safe-area line */
function guides() {
  const hatch: string[] = [];
  for (let d = -H; d < W + H; d += 6) {
    hatch.push(`${f(d)} 0 m ${f(d + H)} ${f(H)} l`);
  }
  return [
    'q',
    // Clip to the bleed strip: the page minus the trim box
    `0 0 ${f(W)} ${f(H)} re ${f(BLEED)} ${f(BLEED)} ${f(W - 2 * BLEED)} ${f(H - 2 * BLEED)} re W* n`,
    '0.898 0 0.490 RG 0.3 w',
    hatch.join(' '),
    'S',
    'Q',
    rect(BLEED, BLEED, W - 2 * BLEED, H - 2 * BLEED, { stroke: TRIM_LINE, lineWidth: 0.6 }),
    'q [3 2.5] 0 d',
    rect(BLEED + SAFE, BLEED + SAFE, W - 2 * (BLEED + SAFE), H - 2 * (BLEED + SAFE), {
      stroke: SAFE_LINE,
      lineWidth: 0.6,
    }),
    'Q',
  ].join('\n');
}

function front(): StoryPage {
  const hot = list(
    H - 262,
    [
      { name: 'Espresso', price: '2.80' },
      { name: 'Flat white', price: '3.60' },
      { name: 'Cappuccino', price: '3.60' },
      { name: 'Latte', price: '3.70' },
      { name: 'Cortado', price: '3.40' },
      { name: 'Filter coffee', price: '2.90', note: 'Refills 1.50, until we run out' },
      { name: 'Hot chocolate', price: '4.10', note: 'Dark, made with whole milk' },
      { name: 'Chai latte', price: '4.00' },
      { name: 'Pot of tea', price: '3.50', note: 'Assam, Earl Grey, peppermint or sencha' },
    ],
    { ink: BUTTER, soft: '#aab6ee', dots: '#7f8fd6' }
  );
  return {
    width: W,
    height: H,
    content: [
      rect(0, 0, W, H, { fill: BLUE }),
      wren(W / 2 + 2, H - 96, BUTTER, BLUE),
      centred(H - 170, 'Little Wren', 40, 'serifBold', BUTTER),
      centred(H - 192, 'Coffee and bakes, 14 Ferry Street', 11, 'serifItalic', '#c7d0f5'),
      ...heading(H - 232, 'Hot drinks', BUTTER, '#7f8fd6'),
      ...hot.ops,
      text(LEFT, hot.y - 8, 'Oat, soya or almond milk, 0.50 extra', {
        size: 9,
        font: 'sansOblique',
        color: BUTTER,
      }),
      guides(),
    ].join('\n'),
  };
}

function back(): StoryPage {
  const colors = { ink: BLUE, soft: SOFT, dots: '#b9a95c' };
  const toast = list(
    H - 76,
    [
      { name: 'Sourdough, butter and jam', price: '4.20' },
      { name: 'Eggs on toast', price: '7.50', note: 'Poached or scrambled, with chilli butter' },
      { name: 'Halloumi flatbread', price: '9.20', note: 'Harissa, mint and pickled red onion' },
      { name: 'Soup of the day', price: '6.90', note: 'With a slice of sourdough' },
    ],
    colors
  );
  const bakes = list(
    toast.y - 36,
    [
      { name: 'Cardamom bun', price: '3.80' },
      { name: 'Almond croissant', price: '3.90' },
      { name: 'Cheese scone', price: '3.20' },
      { name: 'Banana bread', price: '3.40' },
      { name: 'Lemon drizzle', price: '3.50' },
    ],
    colors
  );
  const cold = list(
    bakes.y - 36,
    [
      { name: 'Iced latte', price: '4.20' },
      { name: 'Cold brew', price: '4.00' },
      { name: 'Elderflower lemonade', price: '3.60' },
    ],
    colors
  );
  const bandTop = 74;
  return {
    width: W,
    height: H,
    content: [
      rect(0, 0, W, H, { fill: PAPER }),
      ...heading(H - 56, 'Toast and plates', BLUE, '#b9a95c'),
      ...toast.ops,
      ...heading(toast.y - 14, 'From the oven', BLUE, '#b9a95c'),
      ...bakes.ops,
      ...heading(bakes.y - 14, 'Cold drinks', BLUE, '#b9a95c'),
      ...cold.ops,
      rect(0, 0, W, bandTop, { fill: BLUE }),
      text(LEFT, bandTop - 24, 'Open every day, 7:30 to 16:00', {
        size: 10.5,
        font: 'sansBold',
        color: BUTTER,
      }),
      text(LEFT, bandTop - 38, 'Allergies? Please ask us before you order.', {
        size: 8.5,
        color: '#c7d0f5',
      }),
      // Too close to the trim: inside the safe area line on purpose
      text(LEFT - 14, BLEED + 5, 'littlewren.coffee      @littlewrencoffee', {
        size: 8.5,
        font: 'sansBold',
        color: BUTTER,
      }),
      guides(),
    ].join('\n'),
  };
}

const source: StoryPdfSource = {
  fileName: 'menu-proof.pdf',
  build: () => ({
    title: 'Little Wren menu, proof 2',
    author: 'Little Wren Coffee',
    subject: 'A5 menu, 3 mm bleed',
    pages: [front(), back()],
    outline: [
      { title: 'Front', page: 1 },
      { title: 'Back', page: 2 },
    ],
  }),
};

export default source;
