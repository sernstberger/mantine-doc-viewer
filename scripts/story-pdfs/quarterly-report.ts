/** Quarterly report for the Folio (desktop document app) story: 8 Letter pages with an outline */
import { line, paragraph, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const INK = '#1d1d1f';
const MUTED = '#6e6e73';
const ACCENT = '#2f5d8a';
const RULE = '#d2d2d7';

function frame(title: string, pageNumber: number, body: string[]): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      text(56, H - 56, 'Brightwater Outdoor Co.', { size: 9, color: MUTED }),
      text(W - 56 - 120, H - 56, 'Q3 2026 quarterly report', { size: 9, color: MUTED }),
      line(56, H - 66, W - 56, H - 66, { color: RULE, width: 0.5 }),
      text(56, H - 120, title, { size: 26, font: 'sansBold', color: INK }),
      ...body,
      line(56, 60, W - 56, 60, { color: RULE, width: 0.5 }),
      text(W / 2 - 4, 42, String(pageNumber), { size: 9, color: MUTED }),
    ].join('\n'),
  };
}

function prose(y: number, paragraphs: string[]) {
  const ops: string[] = [];
  let top = y;
  paragraphs.forEach((value) => {
    const block = paragraph(56, top, value, { size: 11, width: W - 112, color: INK, leading: 17 });
    ops.push(block.ops);
    top = block.y - 12;
  });
  return { ops, y: top };
}

function cover(): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      rect(0, 0, W, H, { fill: '#1f3a56' }),
      rect(56, 420, 64, 4, { fill: '#9fc3e6' }),
      text(56, 370, 'Q3 2026', { size: 54, font: 'sansBold', color: '#ffffff' }),
      text(56, 330, 'Quarterly report', { size: 28, color: '#d6e4f2' }),
      text(56, 120, 'Brightwater Outdoor Co.', { size: 13, font: 'sansBold', color: '#ffffff' }),
      text(56, 100, 'Prepared by Finance, 9 October 2026', { size: 11, color: '#9fb6cc' }),
      // The page the reader is asked to remove before sending
      'q 0.9 0.3 0.3 rg BT /F2 64 Tf 0.866 0.5 -0.5 0.866 190 520 Tm (DRAFT) Tj ET Q',
    ].join('\n'),
  };
}

const SECTIONS = [
  { title: 'Highlights', page: 3 },
  { title: 'Revenue', page: 4 },
  { title: 'Regions', page: 5 },
  { title: 'Product lines', page: 6 },
  { title: 'Outlook', page: 7 },
  { title: 'Appendix', page: 8 },
];

function contents(): StoryPage {
  const body = SECTIONS.flatMap((section, index) => {
    const y = H - 190 - index * 34;
    return [
      text(56, y, section.title, { size: 14, color: INK }),
      line(200, y + 3, W - 90, y + 3, { color: RULE, width: 0.5, dash: [1, 3] }),
      text(W - 76, y, String(section.page), { size: 14, color: INK }),
    ];
  });
  const page = frame('Contents', 2, body);
  page.links = SECTIONS.map((section, index) => {
    const y = H - 190 - index * 34;
    return {
      rect: [52, y - 6, W - 56, y + 16] as [number, number, number, number],
      page: section.page,
    };
  });
  return page;
}

function highlights(): StoryPage {
  const stats = [
    ['$48.2M', 'Revenue, up 14% on Q3 2025'],
    ['31.6%', 'Gross margin, up 2.1 points'],
    ['212k', 'Orders shipped'],
  ];
  const body = stats.flatMap(([value, label], index) => {
    const x = 56 + index * 170;
    return [
      text(x, H - 200, value, { size: 30, font: 'sansBold', color: ACCENT }),
      text(x, H - 222, label, { size: 10, color: MUTED }),
    ];
  });
  const copy = prose(H - 290, [
    'Demand for the lightweight tent range carried the quarter. Pre-orders for the Ridgeline 2 opened in July and sold through the first production run in five weeks, which pulled revenue forward from Q4.',
    'Margin improved as freight costs settled and the new Rotterdam warehouse took over European fulfilment from third-party partners. We expect the full benefit of that move from Q1 2027.',
    'Returns fell to 3.8% of orders after the sizing guide was rebuilt around customer measurements rather than manufacturer charts.',
  ]);
  return frame('Highlights', 3, [...body, ...copy.ops]);
}

function revenue(): StoryPage {
  const months = [
    ['Jan', 11.2],
    ['Feb', 10.4],
    ['Mar', 12.8],
    ['Apr', 13.9],
    ['May', 15.1],
    ['Jun', 15.6],
    ['Jul', 16.8],
    ['Aug', 15.9],
    ['Sep', 15.5],
  ] as const;
  const baseY = 360;
  const scale = 16;
  const bars = months.flatMap(([month, value], index) => {
    const x = 76 + index * 54;
    const isQ3 = index >= 6;
    return [
      rect(x, baseY, 32, value * scale, { fill: isQ3 ? ACCENT : '#b9c9da' }),
      text(x + 4, baseY - 16, month, { size: 9, color: MUTED }),
      text(x + 2, baseY + value * scale + 6, value.toFixed(1), { size: 8, color: INK }),
    ];
  });
  const copy = prose(baseY - 60, [
    "Monthly revenue in millions of dollars. Q3 months are shown in dark blue. July was the strongest month in the company's history, driven by Ridgeline 2 pre-orders shipping.",
  ]);
  return frame('Revenue', 4, [
    line(66, baseY, W - 56, baseY, { color: INK, width: 0.75 }),
    ...bars,
    ...copy.ops,
  ]);
}

function regions(): StoryPage {
  const rows = [
    ['Region', 'Q3 2026', 'Q3 2025', 'Change'],
    ['North America', '$26.1M', '$23.4M', '+11.5%'],
    ['Europe', '$14.7M', '$12.0M', '+22.5%'],
    ['Asia Pacific', '$5.9M', '$5.6M', '+5.4%'],
    ['Rest of world', '$1.5M', '$1.3M', '+15.4%'],
    ['Total', '$48.2M', '$42.3M', '+14.0%'],
  ];
  const cols = [56, 270, 380, 490];
  const body = rows.flatMap((row, index) => {
    const y = H - 200 - index * 30;
    const font = index === 0 || index === rows.length - 1 ? 'sansBold' : 'sans';
    return [
      ...row.map((cell, col) => text(cols[col], y, cell, { size: 11, font, color: INK })),
      line(56, y - 10, W - 56, y - 10, { color: RULE, width: index === 0 ? 1 : 0.5 }),
    ];
  });
  const copy = prose(H - 420, [
    'Europe grew fastest after the Rotterdam warehouse cut delivery times from six days to two. North America remains the largest market; growth there came mostly from returning customers.',
  ]);
  return frame('Regions', 5, [...body, ...copy.ops]);
}

function section(title: string, pageNumber: number, paragraphs: string[]): StoryPage {
  return frame(title, pageNumber, prose(H - 170, paragraphs).ops);
}

const source: StoryPdfSource = {
  fileName: 'quarterly-report.pdf',
  build: () => ({
    title: 'Q3 2026 quarterly report',
    author: 'Brightwater Outdoor Co. Finance',
    subject: 'Results for the quarter ending 30 September 2026',
    outline: [{ title: 'Cover', page: 1 }, { title: 'Contents', page: 2 }, ...SECTIONS],
    pages: [
      cover(),
      contents(),
      highlights(),
      revenue(),
      regions(),
      section('Product lines', 6, [
        'Shelter (tents and tarps) was 46% of revenue, up from 39%. Packs held steady at 28%. Apparel fell to 18% as we cleared the summer range early to make room for the insulated jackets launching in October.',
        'The Ridgeline 2 tent alone accounted for $7.9M. Reviews average 4.7 out of 5 across 3,100 ratings, and the most common complaint, the stake bag, is fixed in the second production run.',
        'Cookware remains small at 8% but is our highest-margin line. We will expand it carefully rather than chase volume.',
      ]),
      section('Outlook', 7, [
        'We expect Q4 revenue between $44M and $47M. Seasonal demand for shelter falls after September, while insulated apparel and gifting rise. The pre-order pull-forward means Q4 will look softer than the underlying trend.',
        'Priorities for Q4: ship the insulated jacket range on time, finish moving UK orders to Rotterdam, and start the repair service pilot in Portland and Denver.',
        'We are holding full-year guidance at $172M to $178M.',
      ]),
      section('Appendix', 8, [
        'Figures are unaudited. Revenue is recognised when orders ship. Regional figures are by delivery address. Gross margin excludes warehouse depreciation, which is reported under operating costs.',
        'Questions about this report go to finance@brightwater.example.',
      ]),
    ],
  }),
};

export default source;
