/** A Year 10 persuasive essay for the Markbook (teacher grading) story: 3 Letter pages in Times */
import { StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const MARGIN = 72;
const SIZE = 12;
const LEADING = 24;
const MAX_CHARS = 92;
const INK = '#1a1a1a';

const TITLE = 'Phones Belong in the Locker, Not the Classroom';

const PARAGRAPHS = [
  'Last term, my maths teacher asked a question and the whole room went quiet. It was not the quiet of people thinking. It was the quiet of thirty people looking down at their laps. I know, because I was one of them. That moment is why I believe Fairmount High School should keep phones in lockers from the first bell until the last.',
  'The strongest reason is attention. Researchers at the London School of Economics studied schools that banned phones and found that test scores rose, and rose most for students who were struggling. A phone does not have to buzz to be a distraction. Just knowing that a message might be waiting pulls part of your mind away from the lesson. Nobody can follow an argument about Macbeth while half-wondering who replied in the group chat.',
  'Some people say phones are useful learning tools, and sometimes they are. A phone can look up a word or time an experiment. But the school already owns laptops and calculators for exactly those jobs, and they do not come with games and social media attached. If a teacher really needs phones for a task, they can be handed out for ten minutes and handed back. That is very different from letting every student keep one on the desk all day.',
  'The second reason is how we treat each other. At lunch, half of my year group sits at the same tables without talking, each person staring at a different screen. Worse, a single embarrassing photo can reach the whole school before the teacher has finished the roll. Schools that have banned phones report fewer fights and fewer complaints about online bullying, because there is simply less opportunity during the day. Teachers should not have to act as detectives for things that happen in their classrooms through a screen.',
  'Other people argue that parents need to reach their children in an emergency. This is a fair worry, and I do not dismiss it. But the front office has a phone, and it has always worked. In a real emergency, a parent calling the office is faster and safer than a hundred students all texting at once. Locker storage also means that the phone is still there at the end of the day, when it can be used for what it is best at: getting home safely.',
  'A third objection is that students should learn to manage their own devices, because they will have to in the workplace. I agree that self-control is a skill worth building. However, skills are built with practice and support, not by testing a fifteen-year-old against a machine designed by hundreds of engineers to be hard to put down. Nobody teaches swimming by dropping a beginner in the deep end. We learn to manage phones at home, on weekends and in the evenings, where the stakes are lower and the adults are close by.',
  'There is real evidence that this works. When a secondary school in Victoria introduced locker storage two years ago, teachers reported that students asked more questions, finished more work in class and spent breaks playing handball and cards again. Several students said afterwards that they felt relieved, because nobody expected them to answer messages during the day. A rule that makes the school day calmer for everyone is a rule worth having.',
  'It is also worth asking who benefits when phones stay out. Students who cannot afford the newest model should not have to feel it in every lesson, and students who are anxious about being left out should not have to watch the group chat scroll past during a test. A locker rule treats everyone the same, and that sameness is a kindness.',
  'Some will say that no rule can be enforced, because students will hide a phone in a pocket anyway. That is true of every rule. We do not abandon the uniform policy because someone wears the wrong shoes. What matters is that the expectation is clear and the consequence is small and fair: a phone found in class goes to the office and is collected at three. Most students follow a clear rule, and the few who do not are easy to notice when everyone else is looking up.',
  'Finally, a ban would be fair. Right now, the rules depend on which teacher you have, and students lose time arguing about them. One clear rule, the same in every room, would end that. I am not asking for phones to disappear from our lives. I am asking for six hours a day when we learn to talk, listen and think without a screen. Fairmount should put phones in the locker, and I think most of us would be surprised how much we enjoy the quiet that follows.',
];

function wrap(value: string): string[] {
  const lines: string[] = [];
  let current = '';
  value.split(/\s+/).forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > MAX_CHARS) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines;
}

function build() {
  const pages: string[][] = [[]];
  const frontMatter = [
    text(MARGIN, H - 72, 'Mia Okafor', { font: 'serif', size: SIZE, color: INK }),
    text(MARGIN, H - 96, 'Year 10 English, Ms Haddad, Period 3', {
      font: 'serif',
      size: SIZE,
      color: INK,
    }),
    text(MARGIN, H - 120, '12 November 2026', { font: 'serif', size: SIZE, color: INK }),
    text(MARGIN + 36, H - 168, TITLE, { font: 'serifBold', size: 16, color: INK }),
  ];
  pages[0].push(...frontMatter);

  let pageIndex = 0;
  let y = H - 216;
  PARAGRAPHS.forEach((paragraph) => {
    wrap(paragraph).forEach((lineText, lineIndex) => {
      if (y < 72) {
        pageIndex += 1;
        pages[pageIndex] = [];
        y = H - 72;
      }
      const indent = lineIndex === 0 ? 36 : 0;
      pages[pageIndex].push(
        text(MARGIN + indent, y, lineText, { font: 'serif', size: SIZE, color: INK })
      );
      y -= LEADING;
    });
  });

  return pages.map<StoryPage>((ops, index) => ({
    width: W,
    height: H,
    content: [
      ...ops,
      text(W - MARGIN - 70, H - 40, `Okafor ${index + 1}`, { font: 'serif', size: 11, color: INK }),
    ].join('\n'),
  }));
}

const source: StoryPdfSource = {
  fileName: 'essay.pdf',
  build: () => ({
    title: TITLE,
    author: 'Mia Okafor',
    subject: 'Year 10 persuasive essay',
    pages: build(),
  }),
};

export default source;
