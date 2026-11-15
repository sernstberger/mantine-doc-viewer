/** Five scanned receipts for the Scanbox (phone scanner) story: narrow pages photographed on a table */
import {
  ellipse,
  group,
  line,
  rect,
  StoryPage,
  StoryPdf,
  StoryPdfSource,
  text,
} from './pdf-writer';

const W = 260;
const MARGIN_X = 22;
const PAPER_X = MARGIN_X;
const PAPER_W = W - MARGIN_X * 2;
const CHAR = 4.8; // Courier at 8pt
const INK = '#2b2a28';
const FADED = '#6d6a64';

type Op = (height: number) => string;

class Receipt {
  private ops: Op[] = [];
  /** Distance from the top of the paper */
  cursor = 26;

  constructor(
    private paper: string,
    private tilt: number,
    private table: string
  ) {}

  private put(op: Op) {
    this.ops.push(op);
  }

  /** One line of monospace text; `align` positions it inside the paper */
  line(
    value: string,
    options: {
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: number;
      gap?: number;
      color?: string;
    } = {}
  ) {
    const { align = 'left', bold = false, size = 8, gap = size + 3.4, color = INK } = options;
    const width = value.length * size * 0.6;
    const x =
      align === 'center'
        ? PAPER_X + (PAPER_W - width) / 2
        : align === 'right'
          ? PAPER_X + PAPER_W - 12 - width
          : PAPER_X + 12;
    const top = this.cursor;
    this.put((height) =>
      text(x, height - top - size, value, { size, font: bold ? 'monoBold' : 'mono', color })
    );
    this.cursor += gap;
    return this;
  }

  /** Label left, amount right, in a fixed 34 column grid */
  row(label: string, amount: string, options: { bold?: boolean; size?: number } = {}) {
    const size = options.size ?? 8;
    const columns = Math.floor((PAPER_W - 24) / (size * 0.6));
    const pad = Math.max(1, columns - label.length - amount.length);
    return this.line(`${label}${' '.repeat(pad)}${amount}`, { bold: options.bold, size });
  }

  space(amount: number) {
    this.cursor += amount;
    return this;
  }

  dashes() {
    const top = this.cursor + 2;
    this.put((height) =>
      line(PAPER_X + 12, height - top, PAPER_X + PAPER_W - 12, height - top, {
        color: FADED,
        width: 0.5,
        dash: [2, 2],
      })
    );
    this.cursor += 9;
    return this;
  }

  /** Code 39 style bars from rects, deterministic from the seed */
  barcode(seed: number, label: string, barHeight = 34) {
    const top = this.cursor;
    const x0 = PAPER_X + 26;
    const xEnd = PAPER_X + PAPER_W - 26;
    let state = seed;
    const next = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state;
    };
    const bars: { x: number; w: number }[] = [];
    let x = x0;
    let dark = true;
    while (x < xEnd) {
      const w = 0.7 + (next() % 3) * 0.75;
      if (dark) {
        bars.push({ x, w: Math.min(w, xEnd - x) });
      }
      x += w;
      dark = !dark;
    }
    this.put((height) =>
      bars
        .map((bar) => rect(bar.x, height - top - barHeight, bar.w, barHeight, { fill: INK }))
        .join('\n')
    );
    this.cursor += barHeight + 4;
    return this.line(label, { align: 'center', size: 6.5, color: FADED });
  }

  /** A faint coffee ring or crease to make it a photo, not a render */
  stain(cx: number, top: number, radius: number) {
    this.put((height) =>
      ellipse(cx, height - top, radius, radius * 0.96, { stroke: '#d8c9a8', lineWidth: 1.2 })
    );
    return this;
  }

  crease(top: number) {
    this.put((height) =>
      line(PAPER_X, height - top, PAPER_X + PAPER_W, height - top - 1.5, {
        color: '#b9b5a8',
        width: 0.6,
      })
    );
    return this;
  }

  build(): StoryPage {
    const paperHeight = this.cursor + 22;
    const height = Math.ceil(paperHeight + 36);
    const paperBottom = 18; // y of the paper's bottom edge
    const paperTop = paperBottom + paperHeight;
    // Torn zigzag edge along the top and bottom of the paper
    const teeth = 22;
    const step = PAPER_W / teeth;
    const zig = (y: number, dir: 1 | -1) =>
      Array.from({ length: teeth }, (_, index) => {
        const x = PAPER_X + (dir === 1 ? index * step : PAPER_W - index * step);
        return `${x + (dir * step) / 2} ${y + (index % 2 === 0 ? 3.2 : 0)} l`;
      }).join(' ');
    const paperPath = [
      `${PAPER_X} ${paperBottom} m`,
      zig(paperBottom, 1),
      `${PAPER_X + PAPER_W} ${paperTop} l`,
      zig(paperTop, -1),
      'h f',
    ].join(' ');

    const shadow = `0.55 0.55 0.52 rg ${PAPER_X + 3} ${paperBottom - 3} ${PAPER_W} ${paperHeight} re f`;
    const content = this.ops.map((op) => op(paperTop)).join('\n');

    const cx = W / 2;
    const cy = height / 2;
    const angle = (this.tilt * Math.PI) / 180;
    const cos = Math.cos(angle).toFixed(5);
    const sin = Math.sin(angle).toFixed(5);
    const transform: [number, number, number, number, number, number] = [
      Number(cos),
      Number(sin),
      -Number(sin),
      Number(cos),
      cx - Number(cos) * cx + Number(sin) * cy,
      cy - Number(sin) * cx - Number(cos) * cy,
    ];

    return {
      width: W,
      height,
      content: [
        rect(0, 0, W, height, { fill: this.table }),
        group([shadow, paperFill(this.paper, paperPath), content], transform),
      ].join('\n'),
    };
  }
}

function paperFill(color: string, path: string) {
  const hex = color.replace('#', '');
  const rgb = [0, 2, 4].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
  return `${rgb} rg ${path}`;
}

/* ---------------------------------- receipts --------------------------------- */

function cafe(): StoryPage {
  const r = new Receipt('#fbf9f3', -1.1, '#c9cfcb');
  r.line('BLACK SPARROW COFFEE', { align: 'center', bold: true, size: 9.5, gap: 13 })
    .line('14 Fenwick Lane, Leeds LS1 4RT', { align: 'center', size: 7 })
    .line('VAT no. GB 284 7715 02', { align: 'center', size: 7, gap: 14 })
    .line('Mon 3 Mar 2026          08:42', { size: 7.5 })
    .line('Table 6      Server: Priya', { size: 7.5, gap: 8 })
    .dashes()
    .row('2 x Flat white', '7.40')
    .row('1 x Oat milk', '0.60')
    .row('1 x Cheese toastie', '6.50')
    .row('1 x Almond croissant', '3.80')
    .row('1 x Sparkling water', '2.40')
    .dashes()
    .row('Subtotal', '20.70')
    .row('Service 10%', '2.07')
    .space(2)
    .row('TOTAL GBP', '22.77', { bold: true, size: 9.5 })
    .space(4)
    .row('Visa contactless', '22.77')
    .line('**** **** **** 4417', { size: 7, color: FADED })
    .dashes()
    .row('VAT 20% on 18.98', '3.79', { size: 7 })
    .row('Net', '18.98', { size: 7 })
    .space(10)
    .line('Thank you, see you soon!', { align: 'center', size: 7.5, gap: 12 })
    .barcode(311, '0003 2284 7715 0603', 30)
    .stain(PAPER_X + PAPER_W - 22, r.cursor - 4, 13);
  return r.build();
}

function taxi(): StoryPage {
  const r = new Receipt('#f9f8f4', 0.9, '#c9cfcb');
  r.line('CITY CABS LEEDS', { align: 'center', bold: true, size: 10, gap: 13 })
    .line('Licensed hackney carriage', { align: 'center', size: 7 })
    .line('Licence LCC/H/20418', { align: 'center', size: 7, gap: 14 })
    .line('Date    Tue 4 Mar 2026', { size: 7.5 })
    .line('Start   17:56   End 18:21', { size: 7.5 })
    .line('Cab     442      Dist 6.4 mi', { size: 7.5, gap: 8 })
    .dashes()
    .line('FROM  Leeds station, New Station St', { size: 7 })
    .line('TO    Kirkstall Forge, LS5 3BF', { size: 7, gap: 8 })
    .dashes()
    .row('Fare', '16.80')
    .row('Waiting 4 min', '1.60')
    .row('Evening supplement', '1.00')
    .dashes()
    .row('TOTAL', '19.40', { bold: true, size: 10 })
    .row('Paid cash', '20.00')
    .row('Change', '0.60')
    .space(6)
    .line('Receipt no. 0087213', { align: 'center', size: 7, color: FADED })
    .line('Fares include VAT at 20%', { align: 'center', size: 7, color: FADED })
    .crease(96);
  return r.build();
}

function hardware(): StoryPage {
  const r = new Receipt('#faf8f1', -0.7, '#cdd1ce');
  r.line('HALLAM TRADE & HARDWARE', { align: 'center', bold: true, size: 9, gap: 12 })
    .line('Unit 3, Canal Wharf, Leeds LS11 5BP', { align: 'center', size: 6.5 })
    .line('Tel 0113 496 0182   VAT GB 190 3321 84', { align: 'center', size: 6.5, gap: 12 })
    .line('Wed 5 Mar 2026   13:07   Till 02', { size: 7.5 })
    .line('Invoice HT-0019442   Acct: CASH', { size: 7.5, gap: 8 })
    .dashes()
    .line('M10 expansion bolts 4pk', { size: 7.5, gap: 8.5 })
    .row('  2 @ 6.25', '12.50', { size: 7.5 })
    .line('Plasterboard screws 200pk', { size: 7.5, gap: 8.5 })
    .row('  1 @ 4.95', '4.95', { size: 7.5 })
    .line('Cable clips 7mm white 100pk', { size: 7.5, gap: 8.5 })
    .row('  3 @ 2.10', '6.30', { size: 7.5 })
    .line('Stanley blade set (10)', { size: 7.5, gap: 8.5 })
    .row('  1 @ 3.80', '3.80', { size: 7.5 })
    .line('Masking tape 50mm x 50m', { size: 7.5, gap: 8.5 })
    .row('  2 @ 4.45', '8.90', { size: 7.5 })
    .line('Dust sheet 4m x 5m', { size: 7.5, gap: 8.5 })
    .row('  1 @ 7.20', '7.20', { size: 7.5 })
    .line('Spirit level 600mm', { size: 7.5, gap: 8.5 })
    .row('  1 @ 11.99', '11.99', { size: 7.5 })
    .dashes()
    .row('Net total', '46.60')
    .row('VAT 20%', '9.32')
    .space(2)
    .row('TOTAL GBP', '55.92', { bold: true, size: 9.5 })
    .space(4)
    .row('Mastercard chip & PIN', '55.92', { size: 7.5 })
    .line('Auth 604417   ****  9020', { size: 7, color: FADED })
    .space(8)
    .line('Returns within 28 days with receipt', { align: 'center', size: 6.5 })
    .space(6)
    .barcode(5521, 'HT0019442 02 050326', 36);
  return r.build();
}

function coworking(): StoryPage {
  const r = new Receipt('#fcfbf7', 1.3, '#c6ccc9');
  r.line('THE LOFT', { align: 'center', bold: true, size: 14, gap: 16 })
    .line('Co-working  Boar Lane  Leeds', { align: 'center', size: 7, gap: 12 })
    .line('DAY PASS - HOT DESK', { align: 'center', bold: true, size: 8.5, gap: 12 })
    .line('Member   Guest (Maya Okafor)', { size: 7.5 })
    .line('Date     Thu 6 Mar 2026', { size: 7.5 })
    .line('Access   09:00 - 18:00', { size: 7.5, gap: 8 })
    .dashes()
    .row('Day pass', '18.00')
    .row('Meeting room, 1 hr', '12.00')
    .row('Printing (14 pages)', '1.40')
    .dashes()
    .row('Subtotal', '31.40')
    .row('VAT 20%', '6.28')
    .row('TOTAL GBP', '37.68', { bold: true, size: 9.5 })
    .space(4)
    .row('Paid by card', '37.68')
    .space(6)
    .line('Wi-Fi: loft-guest', { align: 'center', size: 7, color: FADED })
    .line('Pass valid on date of issue only', { align: 'center', size: 6.5, color: FADED })
    .stain(PAPER_X + 30, r.cursor - 2, 12);
  return r.build();
}

function train(): StoryPage {
  const r = new Receipt('#f6f7f4', -1.4, '#c9cfcb');
  r.line('NORTHERN LINE RAIL', { align: 'center', bold: true, size: 9.5, gap: 13 })
    .line('Advance single - e-ticket receipt', { align: 'center', size: 7, gap: 12 })
    .line('LEEDS  >>  MANCHESTER VIC', { bold: true, size: 8.5, gap: 12 })
    .line('Fri 7 Mar 2026', { size: 7.5 })
    .line('Dep 07:48   Arr 08:56', { size: 7.5 })
    .line('Coach C   Seat 41   Standard', { size: 7.5, gap: 8 })
    .dashes()
    .row('Ticket price', '24.50')
    .row('Booking fee', '0.00')
    .row('TOTAL GBP', '24.50', { bold: true, size: 9.5 })
    .line('Rail fares are zero rated for VAT', { size: 6.5, color: FADED, gap: 9 })
    .dashes()
    .line('Ref   KT7M2R9Q', { size: 7.5 })
    .line('Paid  Visa **** 4417', { size: 7.5, gap: 10 })
    .barcode(88231, 'KT7M2R9Q 0703 LDS MCV', 40)
    .crease(120);
  return r.build();
}

const source: StoryPdfSource = {
  fileName: 'receipts.pdf',
  build: (): StoryPdf => ({
    title: 'March expenses',
    author: 'Maya Okafor',
    subject: 'Five scanned receipts',
    pages: [cafe(), taxi(), hardware(), coworking(), train()],
    outline: [
      { title: 'Black Sparrow Coffee', page: 1 },
      { title: 'City Cabs Leeds', page: 2 },
      { title: 'Hallam Trade & Hardware', page: 3 },
      { title: 'The Loft day pass', page: 4 },
      { title: 'Northern Line Rail', page: 5 },
    ],
  }),
};

export default source;
