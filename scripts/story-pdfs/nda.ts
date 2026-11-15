/**
 * Mutual NDA with tracked changes for the Clause (contract review) story: 5 Letter pages,
 * clauses 1-12, insertions in green underline, deletions in red strike-through, an outline
 * entry per clause. The clause text and changes are repeated in the story, keep them in sync.
 */
import { line, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const LEFT = 78;
const RIGHT = W - 78;
const SIZE = 11.8;
const LEADING = 17.4;
const INK = '#1a1f2b';
const MUTED = '#667085';
const INS = '#1b6e3a';
const DEL = '#b3261e';

type Kind = 'plain' | 'ins' | 'del';
type Seg = [Kind, string];

const t = (value: string): Seg => ['plain', value];
const ins = (value: string): Seg => ['ins', value];
const del = (value: string): Seg => ['del', value];

/** Times-Roman advance widths for ASCII 32-126, per 1000 em */
const TIMES = [
  250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500,
  500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611,
  556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722,
  722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500,
  278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
];

function width(value: string, size: number) {
  let total = 0;
  for (const char of value) {
    total += TIMES[char.charCodeAt(0) - 32] ?? 500;
  }
  return (total * size) / 1000;
}

interface Word {
  kind: Kind;
  value: string;
  /** Punctuation that starts a segment sits right after the previous word */
  attach?: boolean;
}

interface Placed extends Word {
  x: number;
  /** The space after this word belongs to the same change as the next word */
  joinNext: boolean;
}

function wrap(segs: Seg[], maxWidth: number, size: number): Placed[][] {
  const words: Word[] = segs.flatMap(([kind, value]) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((word, index) => ({ kind, value: word, attach: index === 0 && /^[,.;]/.test(word) }))
  );
  const space = width(' ', size);
  const lines: Placed[][] = [];
  let current: Placed[] = [];
  let x = 0;
  words.forEach((word) => {
    const w = width(word.value, size);
    if (word.attach && current.length) {
      x -= space;
    }
    if (current.length && x + w > maxWidth) {
      lines.push(current);
      current = [];
      x = 0;
    }
    current.push({ ...word, x, joinNext: false });
    x += w + space;
  });
  if (current.length) {
    lines.push(current);
  }
  lines.forEach((words2) =>
    words2.forEach((word, index) => {
      word.joinNext = index < words2.length - 1 && words2[index + 1].kind === word.kind;
    })
  );
  return lines;
}

/** A paragraph of segments with change marks; returns operators and the next y */
function redline(segs: Seg[], x: number, y: number, maxWidth: number, size = SIZE) {
  const ops: string[] = [];
  const lines = wrap(segs, maxWidth, size);
  const space = width(' ', size);
  lines.forEach((words, index) => {
    const baseline = y - index * LEADING;
    let changed = false;
    words.forEach((word) => {
      const left = x + word.x;
      const w = width(word.value, size) + (word.joinNext ? space : 0);
      const color = word.kind === 'ins' ? INS : word.kind === 'del' ? DEL : INK;
      ops.push(text(left, baseline, word.value, { size, font: 'serif', color }));
      if (word.kind === 'ins') {
        changed = true;
        ops.push(line(left, baseline - 1.8, left + w, baseline - 1.8, { color: INS, width: 0.7 }));
      }
      if (word.kind === 'del') {
        changed = true;
        ops.push(
          line(left, baseline + size * 0.28, left + w, baseline + size * 0.28, {
            color: DEL,
            width: 0.7,
          })
        );
      }
    });
    if (changed) {
      // Change bar in the margin, as word processors draw it
      ops.push(
        line(LEFT - 14, baseline - 3, LEFT - 14, baseline + size, { color: '#7a869a', width: 1.2 })
      );
    }
  });
  return { ops: ops.join('\n'), y: y - lines.length * LEADING };
}

interface Clause {
  title: string;
  page: number;
  /** Paragraphs; a paragraph is a list of segments */
  body: Seg[][];
}

const CLAUSES: Clause[] = [
  {
    title: 'Confidential Information',
    page: 1,
    body: [
      [
        t(
          '"Confidential Information" means all information that one party or its affiliates (the "Disclosing Party") discloses to the other (the "Receiving Party") in connection with the Purpose,'
        ),
        del('that is marked "confidential" or'),
        ins('whether disclosed orally, in writing or by inspection of premises or samples, and'),
        t(
          'that a reasonable person would understand to be confidential from its nature or the circumstances of disclosure. It includes'
        ),
        del('business plans,'),
        ins('pricing, formulations, specifications, forecasts, customer and supplier lists and'),
        t(
          'the terms of any proposed supply arrangement, and the fact that discussions are taking place.'
        ),
      ],
    ],
  },
  {
    title: 'Purpose',
    page: 1,
    body: [
      [
        t(
          'The Receiving Party may use Confidential Information only to evaluate, negotiate and, if the parties agree, perform a supply arrangement between them (the "Purpose"), and for no other purpose. Nothing in this Agreement obliges either party to disclose any particular information or to enter into any further agreement.'
        ),
      ],
    ],
  },
  {
    title: 'Obligations of the Receiving Party',
    page: 2,
    body: [
      [
        t(
          'The Receiving Party shall (a) keep Confidential Information confidential, using at least the same degree of care it uses for its own information of a similar nature and never less than reasonable care; (b) not disclose it to any third party except as permitted by clause 4; and (c) notify the Disclosing Party in writing without delay on becoming aware of any unauthorised use or disclosure.'
        ),
      ],
    ],
  },
  {
    title: 'Permitted recipients',
    page: 2,
    body: [
      [
        t(
          "The Receiving Party may disclose Confidential Information to its and its affiliates' employees, officers, professional advisers"
        ),
        ins('and subcontractors'),
        t(
          '(its "Representatives") who need to know it for the Purpose and who are bound by written obligations of confidentiality no less protective than this Agreement.'
        ),
        del(
          'The Receiving Party is responsible for any breach of this Agreement by its Representatives.'
        ),
        ins(
          'The Receiving Party is responsible for a breach by its Representatives only to the extent that it failed to take reasonable steps to prevent it.'
        ),
      ],
    ],
  },
  {
    title: 'Exclusions',
    page: 2,
    body: [
      [
        t(
          'Confidential Information does not include information that the Receiving Party can show (a) is or becomes public other than through a breach of this Agreement; (b) was lawfully known to it before disclosure'
        ),
        del(', as shown by its written records'),
        t(
          '; (c) was lawfully received from a third party without restriction on its use; or (d) was independently developed without use of or reference to the Confidential Information.'
        ),
      ],
    ],
  },
  {
    title: 'Compelled disclosure',
    page: 3,
    body: [
      [
        t(
          'If the Receiving Party is required by law, court order or a regulator to disclose Confidential Information, it shall, where lawful, give the Disclosing Party prompt written notice so that it may seek a protective order, and shall disclose only the part that it is legally required to disclose.'
        ),
      ],
    ],
  },
  {
    title: 'Term and survival',
    page: 3,
    body: [
      [
        t('This Agreement applies to Confidential Information disclosed during the period of'),
        del('twelve (12) months'),
        ins('twenty-four (24) months'),
        t(
          "from the Effective Date, unless either party ends it earlier by thirty (30) days' written notice. The obligations in clauses 3 to 5 continue for"
        ),
        del('five (5) years'),
        ins('three (3) years'),
        t(
          'after the date of each disclosure, except that obligations for trade secrets continue for as long as the information remains a trade secret'
        ),
        ins('under applicable law'),
        t('.'),
      ],
    ],
  },
  {
    title: 'Return or destruction',
    page: 3,
    body: [
      [
        t('On written request the Receiving Party shall'),
        del('promptly'),
        ins('within thirty (30) days'),
        t(
          'return or destroy all Confidential Information and certify in writing that it has done so'
        ),
        ins(
          ', except that it may keep copies held in routine electronic back-ups or required by law, which remain subject to this Agreement'
        ),
        t('.'),
      ],
    ],
  },
  {
    title: 'No licence',
    page: 4,
    body: [
      [
        t(
          'All Confidential Information remains the property of the Disclosing Party. No licence or other right in any patent, trade mark, copyright or trade secret is granted by this Agreement, and the Disclosing Party gives no warranty as to the accuracy or completeness of its Confidential Information.'
        ),
      ],
    ],
  },
  {
    title: 'Remedies',
    page: 4,
    body: [
      [
        t(
          'Each party acknowledges that damages may not be an adequate remedy for a breach of this Agreement and that the Disclosing Party is entitled to seek injunctive relief'
        ),
        del('without proof of actual damage and without the posting of a bond'),
        t('.'),
        ins(
          'Neither party is liable to the other under this Agreement for indirect or consequential loss, or for loss of profit.'
        ),
      ],
    ],
  },
  {
    title: 'Governing law and courts',
    page: 4,
    body: [
      [
        t('This Agreement and any dispute arising from it are governed by the laws of'),
        del('the State of Delaware'),
        ins('England and Wales'),
        t(', and the parties submit to the exclusive jurisdiction of the'),
        del('state and federal courts located in New Castle County, Delaware'),
        ins('courts of England and Wales'),
        t('.'),
      ],
    ],
  },
  {
    title: 'General',
    page: 5,
    body: [
      [
        t(
          "This Agreement is the entire agreement between the parties on its subject and may be changed only in writing signed by both. Neither party may assign it without the other's written consent"
        ),
        ins(
          ', except to an affiliate or a successor to all or substantially all of its business, on written notice'
        ),
        t(
          '. A provision held unenforceable is severed and the rest of this Agreement continues. This Agreement may be signed in counterparts, including electronically.'
        ),
      ],
    ],
  },
];

function chrome(pageNumber: number): string[] {
  return [
    text(LEFT, H - 46, 'Mutual Non-Disclosure Agreement', {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    }),
    text(RIGHT - 150, H - 46, 'Halden Labs / Northwind Supply', {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    }),
    line(LEFT, H - 54, RIGHT, H - 54, { color: '#d5d9e0', width: 0.5 }),
    line(LEFT, 54, RIGHT, 54, { color: '#d5d9e0', width: 0.5 }),
    text(LEFT, 40, 'Version 3 with changes tracked by Northwind Supply, 12 November 2026', {
      size: 8,
      font: 'sans',
      color: MUTED,
    }),
    text(RIGHT - 38, 40, `Page ${pageNumber} of 5`, { size: 8, font: 'sans', color: MUTED }),
  ];
}

function clauseOps(clause: Clause, index: number, top: number) {
  const ops: string[] = [];
  let y = top;
  ops.push(text(LEFT, y, `${index + 1}.`, { size: 11, font: 'serifBold', color: INK }));
  ops.push(text(LEFT + 22, y, clause.title, { size: 11, font: 'serifBold', color: INK }));
  y -= LEADING + 2;
  clause.body.forEach((segs) => {
    const block = redline(segs, LEFT + 22, y, RIGHT - LEFT - 22);
    ops.push(block.ops);
    y = block.y - 5;
  });
  return { ops, y: y - 22 };
}

function buildPages(): StoryPage[] {
  const pages: string[][] = [1, 2, 3, 4, 5].map((n) => chrome(n));
  const cursor: Record<number, number> = { 1: 0, 2: H - 96, 3: H - 96, 4: H - 96, 5: H - 96 };

  // Page 1: title, parties, legend
  const p1 = pages[0];
  p1.push(
    text(LEFT, H - 108, 'Mutual Non-Disclosure Agreement', {
      size: 20,
      font: 'serifBold',
      color: INK,
    })
  );
  let y = H - 132;
  const intro: Seg[][] = [
    [
      t(
        'This Agreement is made on 3 November 2026 (the "Effective Date") between Halden Labs, Inc., a Delaware corporation whose principal office is at 410 Harbor Street, Wilmington, Delaware 19801 ("Halden"), and Northwind Supply Ltd., a company registered in England and Wales with company number 09412876 whose registered office is at 22 Canal Wharf, Leeds LS11 5BZ ("Northwind"). Each is a "party" and together they are the "parties".'
      ),
    ],
    [
      t(
        "The parties are discussing a supply arrangement for the packaging of Halden's cold-brew range and expect to share confidential information. They agree as follows."
      ),
    ],
  ];
  intro.forEach((segs) => {
    const block = redline(segs, LEFT, y, RIGHT - LEFT);
    p1.push(block.ops);
    y = block.y - 6;
  });
  // Legend for the markup
  y -= 6;
  p1.push(rect(LEFT, y - 22, RIGHT - LEFT, 30, { fill: '#f3f5f8' }));
  p1.push(
    text(LEFT + 10, y - 11, 'Markup from Northwind Supply:', {
      size: 8.5,
      font: 'sans',
      color: MUTED,
    })
  );
  p1.push(text(LEFT + 148, y - 11, 'inserted text', { size: 9.5, font: 'serif', color: INS }));
  p1.push(
    line(LEFT + 148, y - 13, LEFT + 148 + width('inserted text', 9.5), y - 13, {
      color: INS,
      width: 0.7,
    })
  );
  p1.push(text(LEFT + 232, y - 11, 'deleted text', { size: 9.5, font: 'serif', color: DEL }));
  p1.push(
    line(LEFT + 232, y - 8, LEFT + 232 + width('deleted text', 9.5), y - 8, {
      color: DEL,
      width: 0.7,
    })
  );
  y -= 52;
  cursor[1] = y;

  CLAUSES.forEach((clause, index) => {
    const placed = clauseOps(clause, index, cursor[clause.page]);
    pages[clause.page - 1].push(...placed.ops);
    cursor[clause.page] = placed.y;
    if (placed.y < 70) {
      throw new Error(`Clause ${index + 1} overflows page ${clause.page}`);
    }
  });

  // Signature block on page 5
  const p5 = pages[4];
  let sy = cursor[5] - 20;
  p5.push(
    text(LEFT, sy, 'Signed by the parties on the dates below.', {
      size: SIZE,
      font: 'serif',
      color: INK,
    })
  );
  sy -= 56;
  const blocks = [
    {
      x: LEFT,
      party: 'Halden Labs, Inc.',
      who: 'Name: Priya Raman',
      role: 'Title: General Counsel',
    },
    {
      x: LEFT + 250,
      party: 'Northwind Supply Ltd.',
      who: 'Name: Dana Whitfield',
      role: 'Title: Commercial Director',
    },
  ];
  blocks.forEach((block) => {
    p5.push(text(block.x, sy + 34, block.party, { size: 11, font: 'serifBold', color: INK }));
    p5.push(line(block.x, sy, block.x + 200, sy, { color: INK, width: 0.7 }));
    p5.push(text(block.x, sy - 13, 'Signature', { size: 8.5, font: 'sans', color: MUTED }));
    p5.push(text(block.x, sy - 32, block.who, { size: SIZE, font: 'serif', color: INK }));
    p5.push(text(block.x, sy - 47, block.role, { size: SIZE, font: 'serif', color: INK }));
    p5.push(line(block.x, sy - 78, block.x + 200, sy - 78, { color: INK, width: 0.7 }));
    p5.push(text(block.x, sy - 91, 'Date', { size: 8.5, font: 'sans', color: MUTED }));
  });

  return pages.map((ops) => ({ width: W, height: H, content: ops.join('\n') }));
}

const source: StoryPdfSource = {
  fileName: 'nda.pdf',
  build: () => ({
    title: 'Mutual NDA, Halden Labs and Northwind Supply',
    author: 'Northwind Supply Ltd.',
    subject: 'Version 3 with tracked changes',
    outline: CLAUSES.map((clause, index) => ({
      title: `${index + 1}. ${clause.title}`,
      page: clause.page,
    })),
    pages: buildPages(),
  }),
};

export default source;
