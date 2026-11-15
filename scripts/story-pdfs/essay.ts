/**
 * The Year 10 persuasive essays for the Markbook (teacher grading) story: one 2 to 3 page Letter
 * PDF in Times for each of the eight students, each with their own name, title and text. The
 * text and the line layout live in essays/layout.ts, which the story also uses to place the
 * teacher's margin notes
 */
import { ESSAY_PAGE, ESSAYS, EssayText, layOutEssay } from './essays/layout';
import { StoryPage, StoryPdfSource, text } from './pdf-writer';

const { width: W, height: H, margin: MARGIN, size: SIZE } = ESSAY_PAGE;
const INK = '#1a1a1a';

function build(essay: EssayText) {
  const lines = layOutEssay(essay);
  const pages: string[][] = Array.from({ length: lines[lines.length - 1].page + 1 }, () => []);
  pages[0].push(
    text(MARGIN, H - 72, essay.name, { font: 'serif', size: SIZE, color: INK }),
    text(MARGIN, H - 96, 'Year 10 English, Ms Haddad, Period 3', {
      font: 'serif',
      size: SIZE,
      color: INK,
    }),
    text(MARGIN, H - 120, essay.date, { font: 'serif', size: SIZE, color: INK }),
    text(MARGIN + 36, H - 168, essay.title, { font: 'serifBold', size: 16, color: INK })
  );
  lines.forEach((line) =>
    pages[line.page].push(
      text(MARGIN + line.indent, line.y, line.text, { font: 'serif', size: SIZE, color: INK })
    )
  );

  return pages.map<StoryPage>((ops, index) => ({
    width: W,
    height: H,
    content: [
      ...ops,
      text(W - MARGIN - 70, H - 40, `${essay.surname} ${index + 1}`, {
        font: 'serif',
        size: 11,
        color: INK,
      }),
    ].join('\n'),
  }));
}

/** One source per student: essay-okafor.pdf, essay-berg.pdf and so on */
const sources: StoryPdfSource[] = ESSAYS.map((essay) => ({
  fileName: `essay-${essay.id}.pdf`,
  build: () => ({
    title: essay.title,
    author: essay.name,
    subject: 'Year 10 persuasive essay',
    pages: build(essay),
  }),
}));

export default sources;
