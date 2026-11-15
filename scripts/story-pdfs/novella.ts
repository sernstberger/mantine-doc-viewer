/**
 * "A Clock for the Tide" by the fictional Hester Lund: a three chapter novella excerpt for the
 * Leaf (book reader) story. Trade size pages (5.5 x 8.5 in) set like a printed book: justified
 * Times with real word spacing, indented paragraphs, chapters that open low on a fresh page with
 * small capitals, running heads and folios, and an outline with the chapters.
 */
import { escapePdfText, fill, line, StoryPage, StoryPdfSource } from './pdf-writer';

const W = 396;
const H = 612;
const INK = '#1e1c19';
const MUTED = '#6b655c';
const BODY_SIZE = 10.8;
const LEADING = 15.2;
const TOP = H - 74; // baseline of the first text line on a running page
const BOTTOM = 70; // lowest baseline of text
const MARGIN_OUTER = 46;
const MARGIN_INNER = 58;
const MEASURE = W - MARGIN_OUTER - MARGIN_INNER;
const INDENT = 16;
const CHAPTER_SINK = 214; // a chapter's first line starts this far down the page

const BOOK = 'A Clock for the Tide';
const AUTHOR = 'Hester Lund';

/* ----------------------------- Times metrics ----------------------------- */

// Advance widths of Times-Roman (Adobe AFM) in 1/1000 em, for ASCII 32 to 126
const TIMES_ASCII = [
  250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500,
  500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611,
  556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722,
  722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500,
  278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
];

// WinAnsi bytes for typographic punctuation, with their Times widths
const WIN_ANSI: Record<string, [byte: string, width: number]> = {
  '‘': ['\x91', 333],
  '’': ['\x92', 333],
  '“': ['\x93', 444],
  '”': ['\x94', 444],
  '—': ['\x97', 1000],
  '…': ['\x85', 1000],
};

function charWidth(char: string) {
  const special = WIN_ANSI[char];
  if (special) {
    return special[1];
  }
  const code = char.charCodeAt(0);
  return code >= 32 && code <= 126 ? TIMES_ASCII[code - 32] : 500;
}

function measure(value: string, size: number) {
  let total = 0;
  for (const char of value) {
    total += charWidth(char);
  }
  return (total * size) / 1000;
}

/** Curly quotes, em dashes and ellipses from plain typing */
function typeset(value: string) {
  return value
    .replace(/\.\.\./g, '…')
    .replace(/--/g, '—')
    .replace(/(^|[\s(—])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(—])'/g, '$1‘')
    .replace(/'/g, '’');
}

/** Text for a PDF string literal in WinAnsi */
function encode(value: string) {
  return escapePdfText(
    Array.from(value)
      .map((char) => WIN_ANSI[char]?.[0] ?? char)
      .join('')
  );
}

/* -------------------------------- runs -------------------------------- */

interface Run {
  text: string;
  font: 'F3' | 'F5';
  size: number;
}

/** One line of type: runs set in one text object, justified with word spacing (Tw) */
function setLine(x: number, y: number, runs: Run[], wordSpacing = 0, color = INK) {
  const body = runs.map((run) => `/${run.font} ${run.size} Tf (${encode(run.text)}) Tj`).join(' ');
  return `${fill(color)} BT ${wordSpacing.toFixed(3)} Tw ${x.toFixed(2)} ${y.toFixed(2)} Td ${body} 0 Tw ET`;
}

function centred(y: number, value: string, size: number, font: Run['font'] = 'F3', color = INK) {
  // Times-Italic is a touch narrower than the roman; close enough to centre a heading
  const width = measure(value, size) * (font === 'F5' ? 0.95 : 1);
  return setLine((W - width) / 2, y, [{ text: value, font, size }], 0, color);
}

/* ------------------------------ composition ------------------------------ */

interface Word {
  runs: Run[];
  width: number;
}

interface LaidLine {
  words: Word[];
  indent: number;
  last: boolean;
}

/** Breaks a paragraph into lines of the measure; the first words may be set in small capitals */
function breakParagraph(value: string, indent: number, smallCapsWords = 0): LaidLine[] {
  const words: Word[] = typeset(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index < smallCapsWords) {
        // Faux small capitals: the paragraph's first letter full size, the rest smaller
        const letters = Array.from(word.toUpperCase());
        const first = index === 0 ? letters.shift()! : '';
        const rest = letters.join('');
        const small = BODY_SIZE * 0.78;
        const runs: Run[] = [];
        if (first) {
          runs.push({ text: first, font: 'F3', size: BODY_SIZE });
        }
        if (rest) {
          runs.push({ text: rest, font: 'F3', size: small });
        }
        return { runs, width: measure(first, BODY_SIZE) + measure(rest, small) };
      }
      return {
        runs: [{ text: word, font: 'F3', size: BODY_SIZE }],
        width: measure(word, BODY_SIZE),
      };
    });

  const space = measure(' ', BODY_SIZE);
  const lines: LaidLine[] = [];
  let current: Word[] = [];
  let width = 0;
  words.forEach((word) => {
    const available = MEASURE - (lines.length === 0 ? indent : 0);
    const next = current.length ? width + space + word.width : word.width;
    if (current.length && next > available) {
      lines.push({ words: current, indent: lines.length === 0 ? indent : 0, last: false });
      current = [word];
      width = word.width;
    } else {
      current.push(word);
      width = next;
    }
  });
  lines.push({ words: current, indent: lines.length === 0 ? indent : 0, last: true });
  return lines;
}

function renderLine(laid: LaidLine, left: number, y: number) {
  const runs: Run[] = [];
  laid.words.forEach((word, index) => {
    if (index > 0) {
      // A word space belongs to the run before it, in the body size
      runs.push({ text: ' ', font: 'F3', size: BODY_SIZE });
    }
    runs.push(...word.runs);
  });
  // Merge neighbouring runs of the same face so a line is a few strings, not one per word
  const merged = runs.reduce<Run[]>((all, run) => {
    const previous = all[all.length - 1];
    if (previous && previous.font === run.font && previous.size === run.size) {
      previous.text += run.text;
    } else {
      all.push({ ...run });
    }
    return all;
  }, []);
  const natural =
    laid.words.reduce((sum, word) => sum + word.width, 0) +
    (laid.words.length - 1) * measure(' ', BODY_SIZE);
  const gaps = laid.words.length - 1;
  const spare = MEASURE - laid.indent - natural;
  // Justify every line but a paragraph's last; Tw only stretches the spaces
  const wordSpacing = !laid.last && gaps > 0 ? spare / gaps : 0;
  return setLine(left + laid.indent, y, merged, wordSpacing);
}

/* ---------------------------------- text ---------------------------------- */

interface Chapter {
  number: string;
  title: string;
  /** Paragraphs; an empty string is a section break */
  paragraphs: string[];
}

const CHAPTERS: Chapter[] = [
  {
    number: 'One',
    title: 'The Clockmaker’s Window',
    paragraphs: [
      'The clock on the harbour wall at Saltby had stopped at twenty past four, and for eleven days nobody in the town had been able to say with any confidence when the tide would turn.',
      "It was not, strictly, a clock for telling the time. Ines Arden's father had built it the winter before she was born, out of a church tower movement he had bought for the price of its brass and a dial he had painted himself, and instead of hours it told the sea. One hand went round once in twelve hours and twenty-five minutes, which is the length of a tide, more or less, and the other crept along a painted arc that said Neap at one end and Spring at the other. Fishermen set their mornings by it. Children learned to read it before they could read the church clock, and the old women who sold whelks on the quay glanced up at it the way other women glanced at the sky.",
      'Now its hands hung where they had stopped, and the town had begun to feel, in a way that nobody said out loud, that the sea was doing as it pleased.',
      "Ines kept the shop on Chandler Street that had been her father's, with his name still on the glass in gold letters that were flaking at the serifs. She mended watches, mostly, and the occasional carriage clock brought in by a widow who could not bear the silence of a house where it had stopped. She was thirty-one. She had been away, once, to a city with trams and a university, and she had come back when her father was ill, and had stayed after he was not, and she did not think about the reasons for this more than she had to.",
      '"You\'ll be going up to it," said Mrs. Pell, who came in on the twelfth morning with a pocket watch that did not need mending. It was not a question. Mrs. Pell had never in her life asked a question she did not already know the answer to.',
      '"When the weather lets me."',
      '"The weather," said Mrs. Pell, "has been letting you since Tuesday."',
      'This was true. It had been a week of still, pale days, the kind that come in the gap between autumn storms, when the water in the harbour lies flat as pewter and the gulls sit on it without bothering to fly. Ines had watched them from the shop window and had not gone up. She told herself it was because the movement would need a part she did not have, and that she was waiting for it to come on the carrier from Hollin. She had not, in fact, sent for any part. She did not yet know what was wrong.',
      'What she knew was that her father had climbed that wall every first Sunday for twenty-nine years with an oil can in his coat pocket and a cloth over his shoulder, and that the last time he did it she had gone with him, and he had stopped halfway up the iron ladder and rested his forehead against a rung for longer than a man resting, and she had pretended to look at the boats.',
      'Mrs. Pell wound the watch that did not need mending and held it to her ear. "My Albert used to say that clock was the only honest thing in Saltby."',
      '"Your Albert drank in the Anchor."',
      '"That," said Mrs. Pell, "is how he knew."',
      '',
      'In the afternoon a man came down the hill from the station road carrying a wooden case on a strap and a tripod folded under one arm, and stopped in front of the shop and looked at the gold letters for some time before he came in. He was tall, and somewhat younger than his clothes, which were good and had been rained on a great deal. He set the case on her counter with the care of someone putting down a sleeping animal.',
      '"I was told," he said, "that you are the person who knows about the tide clock."',
      '"I\'m the person who knows it\'s stopped."',
      '"Ah." He seemed to find this more interesting than disappointing. "Then you may be exactly the person I need."',
    ],
  },
  {
    number: 'Two',
    title: 'The Surveyor',
    paragraphs: [
      'His name was Tomas Reyne and he worked for the Coastal Survey, which Ines had heard of only as the people who wrote to the harbour master about the state of the breakwater. He had been sent, he said, to measure the shore between Saltby and the Hollin light, and to compare it with the last survey, made forty years ago by a man with a theodolite and a great deal of patience.',
      '"And?"',
      '"And it isn\'t where he left it." He opened the case. Inside, in fitted slots lined with green baize, lay an instrument she did not recognise, all lacquered brass and silvered scales, and beside it a book of tables bound in oilcloth. "Not by much. A yard here. Four yards at the Point. But a coast is not supposed to move at all, as far as the people who pay me are concerned, so a yard is a great deal of trouble."',
      '"What has that to do with the clock?"',
      'He turned the book of tables toward her. The pages were columns of figures in a small hand, and at the head of each column was a date, and beneath each date a time, and beside some of the times, in a different ink, someone had written a single word: Arden.',
      '"Your father," Tomas Reyne said, "wrote to the Survey every month for twenty years. High water and low water at Saltby, read from his clock and checked against his own marks on the harbour steps. He was the most reliable recorder on this coast. We corrected our own figures by his." He paused. "We didn\'t know he had died until the letters stopped."',
      'Ines did not say anything for a while. Outside, the gulls were quarrelling over something on the slipway. She found that she was holding the edge of the counter.',
      '"He never told me," she said at last.',
      '"No. I don\'t suppose he thought of it as anything to tell."',
      'She thought of the first Sundays, the oil can, the cloth, the notebook he kept in his inside pocket that she had always assumed was for his accounts. She thought of the box of his papers she had put in the cupboard under the stairs and had not opened, because opening it would be a kind of agreement.',
      '"The clock stopped eleven days ago," she said. "I haven\'t been up."',
      '"Would you let me come with you, when you go?"',
      "She looked at him, and at the instrument in its green baize, and at the columns of her father's numbers marching down the page in someone else's careful hand, and she understood that she had been waiting for a reason, and that one had walked in out of the rain.",
      '"Tomorrow," she said. "At low water. If the weather lets us."',
      '',
      'That night she opened the box. It held less than she had feared: bills, a few letters from her mother written before Ines could remember her, a photograph of the clock with its dial newly painted and her father beside it looking absurdly young. And at the bottom, tied with string, twenty notebooks, one for each year, every page ruled into columns. High water. Low water. Wind. Remarks. The remarks were sparse, and most of them were about the weather, but here and there, in the same flat pencil, were other things. I. walked today. I. lost a tooth and would not give it up. I. home for Christmas, thinner. I. gone back. I. home.',
      'She read until the lamp guttered, and then she sat in the dark and listened to the sea, which she had heard every night of her life without listening to it, and which went on, as it always had, keeping its own time.',
    ],
  },
  {
    number: 'Three',
    title: 'High Water',
    paragraphs: [
      'They went up at seven, with the harbour drained to its mud and the boats lying over on their sides like sleeping dogs. The iron ladder was cold enough to sting. Tomas came behind her with the brass instrument strapped to his back, and he did not offer to help, and she was grateful.',
      'The clock housing was a wooden box the size of a wardrobe built into the top of the wall, with a door at the back that her father had fitted with a lock and then, finding the key a nuisance, had never locked. Inside it smelled of oil and salt and cold metal, and it was so exactly the smell of his coat that she had to stand still in the doorway for a moment before she could go in.',
      'It did not take her long to find the fault. A gull had got in under the eaves at some point in the autumn and built the beginnings of a nest, and a twist of dry weed had fallen through the gap above the escapement and wound itself round the arbor of the third wheel like thread round a spool. That was all. Eleven days of the town holding its breath over a piece of weed.',
      'She laughed, which surprised her, and the sound came back strangely off the boards. Tomas, crouched in the doorway, raised his eyebrows.',
      '"It\'s nothing," she said. "It\'s a bird."',
      "She cleared it with tweezers and a fine hook, a strand at a time, and cleaned the teeth, and oiled the pivots from her father's can, which she found on its nail just inside the door where he had left it. Then she set the hands. For that she needed the tide, and the tide, it turned out, was what Tomas had brought: his instrument, his tables, his reckoning of the moon. They worked it out together on the back of one of her father's pages, his figures and hers, until they agreed, and she moved the great hand round to where the sea was, and gave the pendulum a push.",
      'It swung. It swung again. Somewhere under her feet the escapement took up its slow, heavy tick, the sound she had heard through her bedroom wall as a child and had believed, until she was quite old, was the sound the sea made when it was thinking.',
      'Below them, on the quay, someone had stopped to look up. Then someone else. By the time they came down the ladder there were a dozen people standing about with their hands in their pockets, pretending to have other business, and Mrs. Pell at the front of them in her good coat.',
      '"Well," said Mrs. Pell. "About time."',
      '',
      "Tomas Reyne stayed in Saltby for three weeks, measuring the shore. In the evenings he came to the shop and they copied her father's notebooks into the Survey's ledgers, column by column, and he showed her how to take a reading at the harbour steps with a graduated staff and a watch, and how to correct it for the wind. When he left he gave her a bundle of printed forms with the Survey's seal at the top and a space at the bottom for the observer's name.",
      '"You don\'t have to," he said, on the station platform.',
      '"I know."',
      'The train came in, and he went, and she walked back down the hill with the forms under her arm. At the bottom of Chandler Street she stopped and looked up at the clock on the wall. The great hand stood a little short of the top of the dial. High water in nineteen minutes. On the painted arc, the small hand had crept toward Spring.',
      "She went into the shop and took her father's name down from the window, letter by letter, with a razor blade and a cloth soaked in turpentine, and in the afternoon, when the light was right, she began to paint her own.",
    ],
  },
];

/* ---------------------------------- pages ---------------------------------- */

/** Odd pages sit on the left of a spread in the reader, so their inner margin is on the right */
function leftMargin(pageNumber: number) {
  return pageNumber % 2 === 1 ? MARGIN_OUTER : MARGIN_INNER;
}

function ornament(y: number) {
  // Three small diamonds, the section mark used at chapter openings and breaks
  const diamond = (cx: number) =>
    `${fill(MUTED)} ${cx} ${y + 2.6} m ${cx + 2.6} ${y} l ${cx} ${y - 2.6} l ${cx - 2.6} ${y} l f`;
  return [diamond(W / 2 - 10), diamond(W / 2), diamond(W / 2 + 10)].join('\n');
}

function folio(pageNumber: number) {
  return centred(42, String(pageNumber), 9, 'F3', MUTED);
}

function runningHead(pageNumber: number, chapter: Chapter) {
  // The left page carries the book, the right page its chapter, as in a printed book
  const value = pageNumber % 2 === 1 ? BOOK : chapter.title;
  return centred(H - 42, value, 8.6, 'F5', MUTED);
}

function titlePage(): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      centred(H - 196, BOOK, 25, 'F3'),
      centred(H - 222, 'a novella', 11, 'F5', MUTED),
      line(W / 2 - 18, H - 252, W / 2 + 18, H - 252, { color: MUTED, width: 0.5 }),
      centred(H - 282, AUTHOR, 12, 'F3'),
      centred(150, 'An excerpt: chapters one to three', 8.6, 'F5', MUTED),
      centred(78, 'Saltby Editions', 8.6, 'F3', MUTED),
    ].join('\n'),
  };
}

function colophon(pageNumber: number): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      ornament(H / 2 + 40),
      centred(H / 2, 'A sample for the Leaf reader.', 9.2, 'F5', MUTED),
      centred(H / 2 - 16, 'The story, its people and its town are invented.', 9.2, 'F5', MUTED),
      folio(pageNumber),
    ].join('\n'),
  };
}

function buildPages() {
  const pages: StoryPage[] = [titlePage()];
  const outline: { title: string; page: number }[] = [];

  CHAPTERS.forEach((chapter) => {
    let pageNumber = pages.length + 1;
    let ops: string[] = [];
    let y: number;

    // Chapter opening: sunk low on a fresh page, no running head
    outline.push({ title: `${chapter.number}. ${chapter.title}`, page: pageNumber });
    ops.push(centred(H - CHAPTER_SINK + 92, chapter.number, 12, 'F5', MUTED));
    ops.push(centred(H - CHAPTER_SINK + 64, chapter.title, 18, 'F3'));
    ops.push(ornament(H - CHAPTER_SINK + 36));
    y = H - CHAPTER_SINK;
    let opening = true;

    const finishPage = () => {
      if (!opening) {
        ops.unshift(runningHead(pageNumber, chapter));
      }
      ops.push(folio(pageNumber));
      pages.push({ width: W, height: H, content: ops.join('\n') });
      pageNumber += 1;
      ops = [];
      y = TOP;
      opening = false;
    };

    let afterBreak = true;
    chapter.paragraphs.forEach((value) => {
      if (value === '') {
        // A section break: a blank line with the ornament, unless it would fall at a page foot
        if (y - LEADING * 2 < BOTTOM) {
          finishPage();
        } else {
          ops.push(ornament(y - LEADING * 0.7));
          y -= LEADING * 2;
        }
        afterBreak = true;
        return;
      }
      const lines = breakParagraph(
        value,
        afterBreak ? 0 : INDENT,
        opening && y === H - CHAPTER_SINK ? 4 : 0
      );
      afterBreak = false;
      lines.forEach((laid, index) => {
        // Never leave a paragraph's last line alone at the top of the next page (a widow)
        const widow = lines.length - index === 2 && index > 0 && y - LEADING < BOTTOM;
        if (y < BOTTOM || widow) {
          finishPage();
        }
        ops.push(renderLine(laid, leftMargin(pageNumber), y));
        y -= LEADING;
      });
    });
    finishPage();
  });

  if (pages.length % 2 === 1) {
    pages.push(colophon(pages.length + 1));
  }
  return { pages, outline };
}

const source: StoryPdfSource = {
  fileName: 'novella.pdf',
  build: () => {
    const { pages, outline } = buildPages();
    return {
      title: BOOK,
      author: AUTHOR,
      subject: 'A novella excerpt in three chapters',
      pages,
      outline,
    };
  },
};

export default source;
