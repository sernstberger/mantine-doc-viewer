/** Policy research report for the Field Report (embedded article) story: 6 Letter pages with a chart and a data table */
import { line, paragraph, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const INK = '#0f1b2d';
const MUTED = '#5a6678';
const TEAL = '#0e5e6f';
const HOT = '#d1603d';
const RULE = '#d7dee6';

const NEIGHBOURHOODS = [
  { name: 'Highland Park', canopy: 41, delta: -4.1, visits: 6 },
  { name: 'Orchard Hill', canopy: 37, delta: -3.2, visits: 8 },
  { name: 'Riverside', canopy: 33, delta: -2.0, visits: 9 },
  { name: 'Millbrook', canopy: 27, delta: -0.8, visits: 13 },
  { name: 'Westgate', canopy: 22, delta: 0.9, visits: 17 },
  { name: 'Station Quarter', canopy: 14, delta: 3.4, visits: 26 },
  { name: 'Eastfield', canopy: 11, delta: 4.6, visits: 31 },
  { name: 'Canal Yards', canopy: 7, delta: 6.3, visits: 39 },
];

function signed(value: number) {
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${Math.abs(value).toFixed(1)}`;
}

function frame(title: string, pageNumber: number, body: string[], kicker = ''): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      text(56, H - 48, 'Calder Urban Policy Lab', { size: 8.5, font: 'sansBold', color: TEAL }),
      text(W - 56 - 150, H - 48, 'Shade and the summer street', { size: 8.5, color: MUTED }),
      line(56, H - 58, W - 56, H - 58, { color: RULE, width: 0.5 }),
      ...(kicker ? [text(56, H - 96, kicker, { size: 10, font: 'sansBold', color: TEAL })] : []),
      text(56, H - 124, title, { size: 24, font: 'sansBold', color: INK }),
      ...body,
      line(56, 56, W - 56, 56, { color: RULE, width: 0.5 }),
      text(56, 40, 'Policy report 2026-04, October 2026', { size: 8.5, color: MUTED }),
      text(W - 56 - 6, 40, String(pageNumber), { size: 8.5, color: MUTED }),
    ].join('\n'),
  };
}

function prose(y: number, paragraphs: string[], x = 56, width = W - 112) {
  const ops: string[] = [];
  let top = y;
  paragraphs.forEach((value) => {
    const block = paragraph(x, top, value, {
      size: 11,
      font: 'serif',
      width,
      color: INK,
      leading: 16,
    });
    ops.push(block.ops);
    top = block.y - 10;
  });
  return { ops, y: top };
}

function cover(): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      rect(0, H - 14, W, 14, { fill: TEAL }),
      text(56, H - 64, 'Calder Urban Policy Lab', { size: 11, font: 'sansBold', color: TEAL }),
      text(56, H - 80, 'Policy report 2026-04', { size: 10, color: MUTED }),
      // A strip of canopy cover per block, darker is shadier
      ...NEIGHBOURHOODS.map((n, i) =>
        rect(56 + i * 62, 430, 56, 90 + n.delta * 12, {
          fill: n.delta < 0 ? '#2b8497' : HOT,
        })
      ),
      line(56, 430, W - 56, 430, { color: INK, width: 0.75 }),
      text(56, 338, 'Shade and', { size: 40, font: 'sansBold', color: INK }),
      text(56, 294, 'the summer street', { size: 40, font: 'sansBold', color: INK }),
      text(56, 258, 'How tree cover shapes the hottest afternoons in Calder', {
        size: 14,
        color: MUTED,
      }),
      text(56, 110, 'Dr. Imani Okafor and Tomas Berglund', {
        size: 11,
        font: 'sansBold',
        color: INK,
      }),
      text(56, 94, 'With field data from the Calder Heat Watch volunteers', {
        size: 10,
        color: MUTED,
      }),
      text(56, 78, 'October 2026', { size: 10, color: MUTED }),
    ].join('\n'),
  };
}

function summary(): StoryPage {
  const stats = [
    [
      '10.4°F',
      'Gap in afternoon surface temperature between the shadiest and the barest neighbourhood',
    ],
    ['3.1°F', 'Cooler for every 10 points of tree canopy, on average'],
    ['6.5x', 'Heat-related emergency visits in Canal Yards compared with Highland Park'],
  ];
  const statOps = stats.flatMap(([value, label], i) => {
    const x = 56 + i * 178;
    const block = paragraph(x, H - 212, label, { size: 9, width: 150, color: MUTED, leading: 12 });
    return [text(x, H - 186, value, { size: 26, font: 'sansBold', color: TEAL }), block.ops];
  });
  const copy = prose(H - 300, [
    'We measured land surface temperature across 41 census tracts in Calder on the seven hottest afternoons of summer 2026, using thermal imagery from the regional air survey and 212 street-level sensors installed by volunteers.',
    'Tree canopy explained more of the variation than any other factor we tested, including building density and the share of paved surface. Neighbourhoods with a third or more of their land under canopy ran about four degrees below the city average. Those under 10 percent ran more than four degrees above it.',
    'The hottest places are also where heat does the most harm. Heat-related emergency department visits rise steadily as canopy falls, and the neighbourhoods at the bottom of the canopy ranking are those with the lowest median household incomes and the fewest air-conditioned homes.',
    'We recommend that the city plant to a heat map rather than to a street map, that new shade be paid for from the stormwater fund, and that tenants be able to ask for a tree.',
  ]);
  return frame('Summary of findings', 2, [...statOps, ...copy.ops], 'Key findings');
}

function chart(): StoryPage {
  const zeroX = 330;
  const scale = 28;
  const top = H - 190;
  const bars = NEIGHBOURHOODS.flatMap((n, i) => {
    const y = top - i * 42;
    const width = Math.abs(n.delta) * scale;
    const x = n.delta < 0 ? zeroX - width : zeroX;
    return [
      text(56, y + 6, n.name, { size: 10, color: INK }),
      text(56, y - 6, `${n.canopy}% canopy`, { size: 8, color: MUTED }),
      rect(x, y - 6, width, 24, { fill: n.delta < 0 ? TEAL : HOT }),
      text(n.delta < 0 ? x - 34 : x + width + 6, y + 3, signed(n.delta), {
        size: 10,
        font: 'sansBold',
        color: INK,
      }),
    ];
  });
  const axis = [
    line(zeroX, top + 24, zeroX, top - 7 * 42 - 14, { color: INK, width: 0.75 }),
    text(zeroX - 66, top + 32, 'Cooler than city', { size: 8, color: MUTED }),
    text(zeroX + 8, top + 32, 'Hotter than city', { size: 8, color: MUTED }),
  ];
  const notes = prose(top - 7 * 42 - 54, [
    'Figure 3. Afternoon land surface temperature compared with the city average, in degrees Fahrenheit, by neighbourhood. Each bar is the mean of seven afternoon passes between 21 June and 30 August 2026.',
  ]);
  return frame('Heat by neighbourhood', 3, [...axis, ...bars, ...notes.ops], 'Findings');
}

function table(): StoryPage {
  const columns = [56, 230, 320, 420];
  const heads = ['Neighbourhood', 'Canopy', 'Surface temp', 'Heat visits'];
  const subs = ['', 'share of land', 'vs city, °F', 'per 10,000'];
  const header = heads.flatMap((head, i) => [
    text(columns[i], H - 170, head, { size: 9.5, font: 'sansBold', color: INK }),
    text(columns[i], H - 182, subs[i], { size: 8, color: MUTED }),
  ]);
  const rows = NEIGHBOURHOODS.flatMap((n, i) => {
    const y = H - 214 - i * 28;
    return [
      text(columns[0], y, n.name, { size: 10.5, color: INK }),
      text(columns[1], y, `${n.canopy}%`, { size: 10.5, color: INK }),
      text(columns[2], y, signed(n.delta), { size: 10.5, color: n.delta > 0 ? HOT : TEAL }),
      text(columns[3], y, String(n.visits), { size: 10.5, color: INK }),
      line(56, y - 10, W - 56, y - 10, { color: RULE, width: 0.5 }),
    ];
  });
  const notes = prose(H - 214 - 8 * 28 - 16, [
    'Table 1. Eight of the 41 tracts studied, ordered by canopy cover. The complete table is in the appendix workbook. Heat visits are emergency department visits coded for heat illness, June to August 2026, per 10,000 residents.',
  ]);
  return frame(
    'The data behind the chart',
    4,
    [
      line(56, H - 188, W - 56, H - 188, { color: INK, width: 1 }),
      ...header,
      ...rows,
      ...notes.ops,
    ],
    'Data'
  );
}

function recommendations(): StoryPage {
  const copy = prose(H - 170, [
    '1. Plant to a heat map. Direct the next 6,000 street trees to the 12 tracts that run more than three degrees above the city average, and plant them before 2029.',
    '2. Pay for shade from the stormwater fund. A mature street tree intercepts roughly 1,400 gallons of rain a year. The fund already pays for pipes that do the same job at ten times the cost per gallon.',
    '3. Let tenants ask. Today a tree can only be requested by the owner of the adjoining property. Renters, who are the majority in the five hottest neighbourhoods, should be able to file a request through the 311 line.',
    '4. Protect what is there. Calder lost 340 acres of canopy between 2019 and 2025, most of it to private lot clearing. A permit for removing a tree over 12 inches across should require replacement planting on the same block.',
  ]);
  return frame('Recommendations', 5, copy.ops, 'What the city can do');
}

function methods(): StoryPage {
  const copy = prose(H - 170, [
    'Surface temperature comes from the Landsat-class thermal passes flown by the regional air survey on 21 June, 8 July, 19 July, 2 August, 14 August, 22 August and 30 August 2026, each between 1 and 3 pm. We averaged the passes and compared every 30 metre cell with the city-wide mean.',
    'Canopy cover is the share of each tract covered by tree crowns, measured from the 2025 aerial survey at 0.6 metre resolution. Street-level sensors were used to check the thermal imagery and to measure the air temperature at head height, which tracks the surface measure within one degree.',
    'Health data are emergency department visits coded for heat illness, supplied by the county health department with counts under 10 suppressed. All results are descriptive; tree cover is not randomly assigned, and neighbourhoods differ in other ways we could not control for.',
    'Data and code are available at calderpolicylab.example/shade.',
  ]);
  return frame('Methods and notes', 6, copy.ops, 'Appendix');
}

const source: StoryPdfSource = {
  fileName: 'field-report.pdf',
  build: () => ({
    title: 'Shade and the summer street',
    author: 'Imani Okafor, Tomas Berglund',
    subject: 'Urban heat and tree cover in Calder, summer 2026',
    outline: [
      { title: 'Cover', page: 1 },
      { title: 'Summary of findings', page: 2 },
      { title: 'Heat by neighbourhood', page: 3 },
      { title: 'The data behind the chart', page: 4 },
      { title: 'Recommendations', page: 5 },
      { title: 'Methods and notes', page: 6 },
    ],
    pages: [cover(), summary(), chart(), table(), recommendations(), methods()],
  }),
};

export default source;
