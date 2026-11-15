/** Exhibition guide for the Atrium (museum kiosk) story: 8 A5 pages in German, one per spread half */
import { ellipse, line, paragraph, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 420;
const H = 595;
const WALL = '#1f3b36';
const YELLOW = '#f2c14e';
const INK = '#1b2b28';
const MUTED = '#5d6b67';
const RULE = '#cfd6d2';
const TINT = '#e8eeea';

interface Room {
  number: number;
  title: string;
  years: string;
  text: string[];
  works: [string, string][];
}

const ROOMS: Room[] = [
  {
    number: 1,
    title: 'Der Fluss als Arbeitsplatz',
    years: '1920 bis 1938',
    text: [
      'Bevor die Staustufen gebaut wurden, war die Lindau ein Verkehrsweg und eine Werkstatt. Fährleute, Flößer und Schleppschiffer prägen die frühen Aufnahmen.',
      'Margarethe Voss begleitete 1924 einen Sommer lang die Fähre von Altenau. Ihre Bilder zeigen Arbeit ohne Pose: nasse Seile, geflickte Segel, Hände.',
    ],
    works: [
      ['Fähre bei Altenau', 'M. Voss, 1924'],
      ['Flößer am Wehr', 'E. Hartung, 1931'],
      ['Seilerei, Hafenstraße', 'M. Voss, 1936'],
    ],
  },
  {
    number: 2,
    title: 'Hochwasser',
    years: '1926 und 1954',
    text: [
      'Zweimal stand die Altstadt unter Wasser. Die Fotografien dieses Raums wurden von Anwohnern aufgenommen, oft aus dem ersten Stock.',
      'Neben den Abzügen hängen Pegelmarken, Briefe und ein Schulheft, in dem ein Zehnjähriger den Wasserstand Tag für Tag notierte.',
    ],
    works: [
      ['Marktplatz im Februar', 'Unbekannt, 1926'],
      ['Boot in der Gerberstraße', 'L. Reinhardt, 1954'],
      ['Pegel am Rathaus', 'E. Hartung, 1954'],
    ],
  },
  {
    number: 3,
    title: 'Badeanstalt und Sommer',
    years: '1946 bis 1962',
    text: [
      'Nach dem Krieg wurde das Ufer zum Ort der Erholung. Lotte Reinhardt fotografierte in der Flussbadeanstalt am Mühlgraben, wo sich Schichtarbeiter und Schulklassen den Steg teilten.',
      'Die Serie entstand mit einer geliehenen Rolleiflex und wurde nie ausgestellt, bis die Familie den Nachlass 2019 dem Haus übergab.',
    ],
    works: [
      ['Sprungturm, 11 Uhr', 'L. Reinhardt, 1951'],
      ['Mittagspause am Steg', 'L. Reinhardt, 1953'],
      ['Badekappen', 'L. Reinhardt, 1958'],
    ],
  },
  {
    number: 4,
    title: 'Brücken',
    years: '1950 bis 1971',
    text: [
      'Elf Brücken verbinden die beiden Ufer. Karl Brandt, Ingenieur und Amateurfotograf, dokumentierte den Neubau der Nordbrücke von der ersten Pfahlgründung bis zur Eröffnung.',
      'Seine Kontaktbögen sind erstmals im Original zu sehen, dazu Konstruktionszeichnungen aus dem Stadtarchiv.',
    ],
    works: [
      ['Pfahlgründung Nordbrücke', 'K. Brandt, 1957'],
      ['Montage des Bogens', 'K. Brandt, 1959'],
      ['Eröffnung', 'K. Brandt, 1961'],
    ],
  },
  {
    number: 5,
    title: 'Nachtschicht am Hafen',
    years: '1960 bis 1975',
    text: [
      'Die letzten Jahre des Stückguthafens zeigt der Schlussraum. Emil Hartung arbeitete selbst als Kranführer und fotografierte seine Schichten mit Langzeitbelichtung.',
      'Die Bilder sind leise und fast menschenleer. Der Raum ist bewusst abgedunkelt; bitte nehmen Sie sich Zeit, bis sich die Augen gewöhnt haben.',
    ],
    works: [
      ['Kran 4, kurz nach Mitternacht', 'E. Hartung, 1963'],
      ['Lagerhalle C', 'E. Hartung, 1968'],
      ['Letzte Schicht', 'E. Hartung, 1975'],
    ],
  },
];

function footer(pageNumber: number): string {
  return [
    line(32, 44, W - 32, 44, { color: RULE, width: 0.5 }),
    text(32, 28, 'Kunsthalle Lindenau', { size: 8, font: 'sansBold', color: MUTED }),
    text(W - 32 - 8, 28, String(pageNumber), { size: 8, color: MUTED }),
  ].join('\n');
}

function cover(): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      rect(0, 0, W, H, { fill: WALL }),
      rect(32, 470, 56, 56, { fill: YELLOW }),
      text(47, 485, 'A', { size: 30, font: 'sansBold', color: WALL }),
      text(32, 380, 'Wasserzeichen', { size: 40, font: 'sansBold', color: '#f3f1ea' }),
      text(32, 342, 'Fotografie am Fluss', { size: 22, color: '#f3f1ea' }),
      text(32, 316, '1920 bis 1975', { size: 22, color: YELLOW }),
      line(32, 270, 120, 270, { color: YELLOW, width: 2 }),
      text(32, 244, 'Ausstellungsführer', { size: 12, font: 'sansBold', color: '#f3f1ea' }),
      text(32, 228, '5 Räume im Erdgeschoss und ersten Obergeschoss', {
        size: 10,
        color: '#b9c9c3',
      }),
      text(32, 60, 'Kunsthalle Lindenau', { size: 11, font: 'sansBold', color: '#f3f1ea' }),
      text(32, 44, 'Mühlgraben 12, Lindenau', { size: 9, color: '#b9c9c3' }),
    ].join('\n'),
  };
}

function roomBox(n: number, x: number, y: number, w: number, h: number, label: string) {
  return [
    rect(x, y, w, h, { fill: TINT, stroke: WALL, lineWidth: 1.5 }),
    rect(x + 8, y + h - 34, 26, 26, { fill: YELLOW }),
    text(x + 16, y + h - 27, String(n), { size: 14, font: 'sansBold', color: WALL }),
    text(x + 8, y + 10, label, { size: 8, color: INK }),
  ];
}

function floorPlan(): StoryPage {
  const link = (n: number, x: number, y: number, w: number, h: number) => ({
    rect: [x, y, x + w, y + h] as [number, number, number, number],
    page: n + 2,
  });
  return {
    width: W,
    height: H,
    links: [
      link(1, 40, 380, 150, 100),
      link(2, 190, 380, 190, 100),
      link(3, 40, 280, 150, 100),
      link(4, 40, 130, 190, 100),
      link(5, 230, 130, 150, 100),
    ],
    content: [
      text(32, H - 64, 'Raumplan', { size: 24, font: 'sansBold', color: INK }),
      text(32, H - 84, 'Ein Rundgang dauert etwa 50 Minuten.', { size: 10, color: MUTED }),

      text(40, 492, 'Erdgeschoss', { size: 9, font: 'sansBold', color: MUTED }),
      ...roomBox(1, 40, 380, 150, 100, 'Der Fluss als Arbeitsplatz'),
      ...roomBox(2, 190, 380, 190, 100, 'Hochwasser'),
      ...roomBox(3, 40, 280, 150, 100, 'Badeanstalt und Sommer'),
      rect(190, 280, 190, 100, { fill: '#ffffff', stroke: WALL, lineWidth: 1.5 }),
      text(200, 364, 'Foyer', { size: 9, font: 'sansBold', color: INK }),
      text(200, 290, 'Kasse, Garderobe, Treppe', { size: 8, color: INK }),
      ellipse(330, 326, 8, 8, { fill: '#c0392b' }),
      text(318, 304, 'Sie sind hier', { size: 8, font: 'sansBold', color: '#c0392b' }),

      text(40, 242, '1. Obergeschoss', { size: 9, font: 'sansBold', color: MUTED }),
      ...roomBox(4, 40, 130, 190, 100, 'Brücken'),
      ...roomBox(5, 230, 130, 150, 100, 'Nachtschicht am Hafen'),

      line(32, 108, W - 32, 108, { color: RULE, width: 0.5 }),
      text(32, 90, 'Aufzug und Toiletten finden Sie im Foyer.', { size: 9, color: INK }),
      text(32, 76, 'Die Räume 4 und 5 sind über die Treppe oder den Aufzug erreichbar.', {
        size: 9,
        color: MUTED,
      }),
      footer(2),
    ].join('\n'),
  };
}

function roomPage(room: Room): StoryPage {
  let y = 420;
  const body: string[] = [];
  room.text.forEach((value) => {
    const block = paragraph(32, y, value, { size: 11, width: W - 64, color: INK, leading: 16 });
    body.push(block.ops);
    y = block.y - 10;
  });
  const worksTop = Math.min(y - 14, 250);
  return {
    width: W,
    height: H,
    content: [
      rect(0, H - 150, W, 150, { fill: WALL }),
      rect(32, H - 118, 64, 64, { fill: YELLOW }),
      text(room.number > 9 ? 40 : 52, H - 100, String(room.number), {
        size: 40,
        font: 'sansBold',
        color: WALL,
      }),
      text(112, H - 82, room.title, { size: 18, font: 'sansBold', color: '#f3f1ea' }),
      text(112, H - 100, room.years, { size: 11, color: YELLOW }),
      ...body,
      text(32, worksTop, 'Ausgewählte Werke', { size: 11, font: 'sansBold', color: INK }),
      ...room.works.flatMap(([title, credit], index) => {
        const rowY = worksTop - 24 - index * 30;
        return [
          line(32, rowY + 18, W - 32, rowY + 18, { color: RULE, width: 0.5 }),
          text(32, rowY, title, { size: 11, color: INK }),
          text(W - 32 - credit.length * 5.2, rowY, credit, { size: 9, color: MUTED }),
        ];
      }),
      footer(room.number + 2),
    ].join('\n'),
  };
}

function credits(): StoryPage {
  const rows: [string, string][] = [
    ['Kuratorin', 'Dr. Annika Behrendt'],
    ['Assistenz', 'Jonas Kessler'],
    ['Ausstellungsgestaltung', 'Büro Fährmann, Lindenau'],
    ['Restaurierung', 'Werkstatt für Papier, Lindenau'],
    ['Lichtplanung', 'Studio Nordlicht'],
    ['Übersetzung', 'Sprachdienst Maurer'],
  ];
  const intro = paragraph(
    32,
    430,
    'Wir danken den Familien Voss, Hartung und Reinhardt, dem Stadtarchiv Lindenau sowie allen Leihgebern, die ihre Abzüge zum ersten Mal der Öffentlichkeit anvertraut haben.',
    { size: 11, width: W - 64, color: INK, leading: 16 }
  );
  return {
    width: W,
    height: H,
    content: [
      text(32, H - 64, 'Impressum', { size: 24, font: 'sansBold', color: INK }),
      text(32, H - 84, 'Wasserzeichen. Fotografie am Fluss, 1920 bis 1975', {
        size: 10,
        color: MUTED,
      }),
      intro.ops,
      ...rows.flatMap(([role, name], index) => {
        const y = 330 - index * 28;
        return [
          line(32, y + 18, W - 32, y + 18, { color: RULE, width: 0.5 }),
          text(32, y, role, { size: 9, color: MUTED }),
          text(180, y, name, { size: 11, color: INK }),
        ];
      }),
      rect(32, 84, W - 64, 56, { fill: TINT }),
      text(44, 120, 'Öffnungszeiten', { size: 10, font: 'sansBold', color: INK }),
      text(44, 104, 'Dienstag bis Sonntag, 10 bis 18 Uhr. Donnerstag bis 21 Uhr.', {
        size: 9,
        color: INK,
      }),
      text(44, 92, 'Montag geschlossen.', { size: 9, color: MUTED }),
      footer(8),
    ].join('\n'),
  };
}

const source: StoryPdfSource = {
  fileName: 'exhibition-guide.pdf',
  build: () => ({
    title: 'Wasserzeichen. Fotografie am Fluss, 1920 bis 1975',
    author: 'Kunsthalle Lindenau',
    subject: 'Ausstellungsführer',
    outline: [
      { title: 'Titel', page: 1 },
      { title: 'Raumplan', page: 2 },
      ...ROOMS.map((room) => ({
        title: `Raum ${room.number}: ${room.title}`,
        page: room.number + 2,
      })),
      { title: 'Impressum', page: 8 },
    ],
    pages: [cover(), floorPlan(), ...ROOMS.map(roomPage), credits()],
  }),
};

export default source;
