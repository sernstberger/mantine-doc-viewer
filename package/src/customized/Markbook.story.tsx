import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useMemo, useState } from 'react';
import { ActionIcon, Button, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { ESSAYS, getNoteAnchors, NoteAnchor } from '../../../scripts/story-pdfs/essays/layout';
import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from '../index';
import classes from './Markbook.module.css';

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });

export default {
  title: 'DocViewer/Apps/Markbook (teacher grading)',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story: React.ComponentType) => (
      <DocViewerAdapterProvider pdf={pdfAdapter}>
        <Story />
      </DocViewerAdapterProvider>
    ),
  ],
};

type Score = 1 | 2 | 3 | 4;

interface Student {
  id: string;
  name: string;
  submitted: string;
  late?: boolean;
  /** Scores in the order of CRITERIA, null while not marked */
  scores: (Score | null)[];
  returned: boolean;
}

interface Criterion {
  name: string;
  /** What the teacher is looking for, one line per score */
  descriptors: [string, string, string, string];
  /** What the teacher scribbles in the margin for each score */
  notes: [string, string, string, string];
}

const BAND_LABELS = ['Beginning', 'Developing', 'Secure', 'Strong'];

const CRITERIA: Criterion[] = [
  {
    name: 'Argument',
    descriptors: [
      'No clear position, or it changes part-way through.',
      'Position is stated but not always argued.',
      'Clear position, argued throughout.',
      'Convincing position that answers the other side.',
    ],
    notes: [
      'Where is your claim?',
      'Argue it, not just say it',
      'Clear and steady',
      'Convincing. Yes!',
    ],
  },
  {
    name: 'Evidence',
    descriptors: [
      'Opinions only, no examples or facts.',
      'Some examples, but vague or unsourced.',
      'Relevant facts and examples, mostly sourced.',
      'Precise, sourced evidence that carries the argument.',
    ],
    notes: ['Needs a fact here', 'Which study? Name it', 'Good sources', 'Great evidence'],
  },
  {
    name: 'Structure',
    descriptors: [
      'Ideas are hard to follow.',
      'Paragraphs exist, but order is uneven.',
      'Clear opening, middle and close.',
      'Every paragraph builds on the last.',
    ],
    notes: ['Hard to follow', 'Reorder these', 'Nice flow', 'Builds beautifully'],
  },
  {
    name: 'Language',
    descriptors: [
      'Errors often get in the way of meaning.',
      'Mostly clear, with frequent slips.',
      'Controlled, with few slips.',
      'Persuasive voice, precise word choice.',
    ],
    notes: ['Read it aloud', 'Check commas', 'Well controlled', 'Lovely voice'],
  },
];

const MAX_TOTAL = CRITERIA.length * 4;

/**
 * Where each criterion's note goes on each essay: the paragraph it is about, from the top of the
 * page in PDF points. Computed with the same layout that draws the essay PDFs, so the notes
 * always sit beside their paragraphs. The note sits in the left margin
 */
const NOTE_ANCHORS: Record<string, NoteAnchor[]> = Object.fromEntries(
  ESSAYS.map((essay) => [essay.id, getNoteAnchors(essay)])
);

const STUDENTS: Student[] = [
  {
    id: 'berg',
    name: 'Tomas Berg',
    submitted: 'Thu 12 Nov, 4:12 pm',
    scores: [3, 3, 2, 3],
    returned: true,
  },
  {
    id: 'brooks',
    name: 'Aiyana Brooks',
    submitted: 'Thu 12 Nov, 9:40 am',
    scores: [4, 4, 3, 3],
    returned: true,
  },
  {
    id: 'choi',
    name: 'Hannah Choi',
    submitted: 'Wed 11 Nov, 8:05 pm',
    scores: [2, 2, 3, 2],
    returned: true,
  },
  {
    id: 'novak',
    name: 'Elias Novak',
    submitted: 'Fri 13 Nov, 7:58 am',
    late: true,
    scores: [null, null, null, null],
    returned: false,
  },
  {
    id: 'okafor',
    name: 'Mia Okafor',
    submitted: 'Thu 12 Nov, 6:21 pm',
    scores: [null, null, null, null],
    returned: false,
  },
  {
    id: 'reyes',
    name: 'Callum Reyes',
    submitted: 'Thu 12 Nov, 11:47 pm',
    scores: [null, null, null, null],
    returned: false,
  },
  {
    id: 'silva',
    name: 'Mateo Silva',
    submitted: 'Thu 12 Nov, 3:30 pm',
    scores: [null, null, null, null],
    returned: false,
  },
  {
    id: 'whitfield',
    name: 'Dara Whitfield',
    submitted: 'Wed 11 Nov, 5:15 pm',
    scores: [4, 3, 3, 3],
    returned: true,
  },
];

function total(scores: (Score | null)[]) {
  return scores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
}

function isMarked(scores: (Score | null)[]) {
  return scores.every((score) => score !== null);
}

function statusOf(student: Student) {
  if (student.returned) {
    return { label: `Returned, ${total(student.scores)}/${MAX_TOTAL}`, tone: 'done' };
  }
  const marked = student.scores.filter((score) => score !== null).length;
  if (marked > 0) {
    return { label: `Marking, ${marked} of ${CRITERIA.length}`, tone: 'progress' };
  }
  return {
    label: student.late ? 'Late, to mark' : 'To mark',
    tone: student.late ? 'late' : 'todo',
  };
}

function summaryNote(value: number) {
  if (value >= 14) {
    return 'Excellent work!';
  }
  if (value >= 11) {
    return 'Good, tighten the ending';
  }
  if (value >= 8) {
    return 'On the way, see notes';
  }
  return 'Let us talk about this one';
}

/** A hand-drawn loop that sits round the total, a little open at the end like a real pen stroke */
function PenCircle() {
  return (
    <svg className={classes.penCircle} viewBox="0 0 220 96" aria-hidden>
      <path
        pathLength={1}
        d="M196 20 C 168 2, 60 -2, 26 30 C 4 52, 20 86, 78 90 C 140 96, 205 78, 210 46 C 213 24, 170 6, 112 6"
      />
    </svg>
  );
}

/**
 * A Year 10 English teacher marks persuasive essays against a four-criteria rubric. The bold
 * thing is the red pen: the total and the margin notes are handwritten next to calm UI.
 */
export function Markbook() {
  const [students, setStudents] = useState(STUDENTS);
  const [currentId, setCurrentId] = useState('okafor');
  const [notice, setNotice] = useState('');

  const index = students.findIndex((student) => student.id === currentId);
  const student = students[index];
  const marked = isMarked(student.scores);
  const returnedCount = students.filter((item) => item.returned).length;
  const sum = total(student.scores);

  const scoredNotes = useMemo(
    () =>
      CRITERIA.map((criterion, criterionIndex) => {
        const score = student.scores[criterionIndex];
        return score ? criterion.notes[score - 1] : null;
      }),
    [student.scores]
  );

  const select = (id: string) => {
    setCurrentId(id);
    setNotice('');
  };

  const setScore = (criterionIndex: number, score: Score) => {
    if (student.returned) {
      return;
    }
    setStudents((items) =>
      items.map((item) =>
        item.id === student.id
          ? { ...item, scores: item.scores.map((old, i) => (i === criterionIndex ? score : old)) }
          : item
      )
    );
  };

  const returnToStudent = () => {
    const first = student.name.split(' ')[0];
    setStudents((items) =>
      items.map((item) => (item.id === student.id ? { ...item, returned: true } : item))
    );
    const next =
      [...students.slice(index + 1), ...students.slice(0, index)].find((item) => !item.returned) ??
      null;
    setNotice(`Returned to ${first}`);
    if (next) {
      setCurrentId(next.id);
    }
  };

  return (
    <div className={classes.app}>
      <header className={classes.header}>
        <div className={classes.brand}>Markbook</div>
        <div className={classes.assignment}>
          <span className={classes.assignmentTitle}>Persuasive essay: phones in school</span>
          <span className={classes.assignmentMeta}>Year 10 English, class 10B, due Fri 13 Nov</span>
        </div>
        <div
          className={classes.progress}
          aria-label={`${returnedCount} of ${students.length} returned`}
        >
          <div className={classes.progressTrack} aria-hidden>
            <div
              className={classes.progressFill}
              style={{ width: `${(returnedCount / students.length) * 100}%` }}
            />
          </div>
          <span>
            {returnedCount} of {students.length} returned
          </span>
        </div>
      </header>

      <nav className={classes.roster} aria-label="Students">
        <h2 className={classes.panelTitle}>10B</h2>
        <ul className={classes.rosterList}>
          {students.map((item) => {
            const status = statusOf(item);
            return (
              <li key={item.id}>
                <UnstyledButton
                  className={classes.student}
                  data-active={item.id === currentId || undefined}
                  aria-current={item.id === currentId ? 'true' : undefined}
                  onClick={() => select(item.id)}
                >
                  <span className={classes.studentName}>{item.name}</span>
                  <span className={classes.studentMeta}>{item.submitted}</span>
                  <span className={classes.studentStatus} data-tone={status.tone}>
                    {status.label}
                  </span>
                </UnstyledButton>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className={classes.reader}>
        <div className={classes.readerBar}>
          <ActionIcon
            variant="default"
            className={classes.step}
            aria-label="Previous student"
            disabled={index === 0}
            onClick={() => select(students[index - 1].id)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ActionIcon>
          <div className={classes.readerName}>
            <strong>{student.name}</strong>
            <span>
              Student {index + 1} of {students.length}
            </span>
          </div>
          <ActionIcon
            variant="default"
            className={classes.step}
            aria-label="Next student"
            disabled={index === students.length - 1}
            onClick={() => select(students[index + 1].id)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ActionIcon>
        </div>

        <DocViewer
          // Each student handed in an essay of their own (scripts/story-pdfs/essay.ts)
          src={`/stories/essay-${student.id}.pdf`}
          // Next student opens the next essay at the same zoom and scroll position
          keepView
          fileName={`${student.name}, persuasive essay.pdf`}
          size="xs"
          color="blue"
          radius="md"
          defaultZoom="fit"
          toolbarControls={{
            fullscreen: false,
            print: false,
            download: false,
            rotate: false,
            layout: false,
            presentation: false,
            info: false,
            outline: false,
            thumbnails: false,
          }}
          className={classes.viewer}
          classNames={{
            root: classes.root,
            toolbar: classes.toolbar,
            title: classes.title,
            control: classes.control,
            pageIndicator: classes.pageIndicator,
            zoomLevel: classes.zoomLevel,
            search: classes.search,
            body: classes.body,
            page: classes.page,
          }}
          // The red pen: each scored criterion's note is written in the margin beside its paragraph
          pagesProps={{
            gap: 'md',
            matchColor: 'yellow',
            renderPageOverlay: ({ pageNumber, scale }) =>
              CRITERIA.map((criterion, criterionIndex) => {
                const anchor = NOTE_ANCHORS[student.id]?.[criterionIndex];
                const note = scoredNotes[criterionIndex];
                if (!anchor || anchor.page !== pageNumber || !note) {
                  return null;
                }
                return (
                  <div
                    key={`${student.id}-${criterion.name}-${note}`}
                    className={classes.penMark}
                    style={
                      {
                        top: anchor.top * scale,
                        height: (anchor.bottom - anchor.top) * scale,
                        width: 66 * scale,
                        '--mb-scale': scale,
                      } as React.CSSProperties
                    }
                  >
                    <p className={classes.penNote}>
                      <VisuallyHidden>{criterion.name}: </VisuallyHidden>
                      {note}
                    </p>
                    <svg
                      className={classes.penBracket}
                      viewBox="0 0 10 100"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <path
                        d="M2 1 C7 2 6 6 6 12 L6.6 44 C6.8 48 8 50 9.5 50 C8 50 6.8 52 6.6 56 L6 88 C6 94 7 98 2 99"
                        pathLength={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                );
              }),
          }}
        />
      </main>

      <aside className={classes.rubric} aria-label="Rubric">
        <h2 className={classes.panelTitle}>Rubric</h2>

        <div className={classes.criteria}>
          {CRITERIA.map((criterion, criterionIndex) => {
            const score = student.scores[criterionIndex];
            return (
              <fieldset
                className={classes.criterion}
                key={criterion.name}
                disabled={student.returned}
              >
                <legend className={classes.criterionName}>{criterion.name}</legend>
                <div className={classes.scoreRow}>
                  {([1, 2, 3, 4] as Score[]).map((value) => (
                    <label className={classes.score} key={value} data-value={value}>
                      <input
                        className={classes.scoreInput}
                        type="radio"
                        name={`${student.id}-${criterion.name}`}
                        checked={score === value}
                        onChange={() => setScore(criterionIndex, value)}
                        aria-label={`${criterion.name}: ${value}, ${BAND_LABELS[value - 1]}`}
                      />
                      <span className={classes.scoreFace}>{value}</span>
                    </label>
                  ))}
                </div>
                <p className={classes.descriptor}>
                  {score ? criterion.descriptors[score - 1] : 'Choose a score from 1 to 4.'}
                </p>
              </fieldset>
            );
          })}
        </div>

        <div className={classes.totalBlock}>
          <div className={classes.totalLabel}>Total</div>
          <div className={classes.total} data-empty={sum === 0 || undefined}>
            <span className={classes.totalNumber} aria-label={`${sum} out of ${MAX_TOTAL}`}>
              {sum}
              <span className={classes.totalOutOf}>/{MAX_TOTAL}</span>
            </span>
            {marked && <PenCircle key={`${student.id}-circle`} />}
          </div>
          <p className={classes.summary} data-visible={marked || undefined}>
            {marked
              ? summaryNote(sum)
              : `${CRITERIA.length - student.scores.filter((s) => s !== null).length} to score`}
          </p>
        </div>

        <Button
          className={classes.returnButton}
          disabled={!marked || student.returned}
          onClick={returnToStudent}
          fullWidth
        >
          {student.returned ? 'Returned' : 'Return to student'}
        </Button>
        <div className={classes.notice} role="status">
          {notice}
        </div>
      </aside>
    </div>
  );
}
