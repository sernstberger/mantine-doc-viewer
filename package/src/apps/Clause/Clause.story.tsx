import { Button, SegmentedControl, Textarea } from '@mantine/core';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { DocViewer, useDocViewer } from '../../index';
import classes from './Clause.module.css';
import { pdfConsole } from '../../test-utils/pdf-console';

export default {
  title: 'Apps/Clause',
  parameters: { layout: 'fullscreen', ...pdfConsole },
};

type Kind = 'plain' | 'ins' | 'del';
type Seg = [Kind, string];
type Status = 'pending' | 'accepted' | 'countered';

interface ClauseInfo {
  number: number;
  title: string;
  page: number;
  /** Top and bottom of the clause on its page, in PDF points from the top */
  span: [number, number];
  /** The change as Northwind marked it, null when the clause is untouched */
  change: null | {
    segs: Seg[];
    comment: string;
    /** What counsel would answer, prefilled when pushing back */
    counter: string;
  };
}

// The page numbers and text mirror scripts/story-pdfs/nda.ts
const CLAUSES: ClauseInfo[] = [
  {
    number: 1,
    title: 'Confidential Information',
    page: 1,
    span: [312, 452],
    change: {
      segs: [
        ['plain', '...in connection with the Purpose, '],
        ['del', 'that is marked "confidential" or'],
        [
          'ins',
          'whether disclosed orally, in writing or by inspection of premises or samples, and',
        ],
        ['plain', ' that a reasonable person would understand to be confidential... It includes '],
        ['del', 'business plans,'],
        [
          'ins',
          'pricing, formulations, specifications, forecasts, customer and supplier lists and',
        ],
        ['plain', ' the terms of any proposed supply arrangement...'],
      ],
      comment:
        'We would rather not rely on marking, our plant visits are mostly verbal. The longer list is the information we expect to share with you.',
      counter: '',
    },
  },
  { number: 2, title: 'Purpose', page: 1, span: [480, 568], change: null },
  {
    number: 3,
    title: 'Obligations of the Receiving Party',
    page: 2,
    span: [84, 189],
    change: null,
  },
  {
    number: 4,
    title: 'Permitted recipients',
    page: 2,
    span: [217, 340],
    change: {
      segs: [
        ['plain', '...professional advisers '],
        ['ins', 'and subcontractors'],
        ['plain', ' (its "Representatives") who need to know it... '],
        [
          'del',
          'The Receiving Party is responsible for any breach of this Agreement by its Representatives.',
        ],
        [
          'ins',
          'The Receiving Party is responsible for a breach by its Representatives only to the extent that it failed to take reasonable steps to prevent it.',
        ],
      ],
      comment:
        'Our filling partner in Rotherham is a subcontractor, and we cannot guarantee what they do on their own premises.',
      counter:
        'Subcontractors are fine if each signs a written confidentiality undertaking first. Each party stays fully responsible for its Representatives, as in the original wording.',
    },
  },
  {
    number: 5,
    title: 'Exclusions',
    page: 2,
    span: [368, 473],
    change: {
      segs: [
        ['plain', '...(b) was lawfully known to it before disclosure'],
        ['del', ', as shown by its written records'],
        ['plain', '; (c) was lawfully received from a third party...'],
      ],
      comment: 'Nobody keeps written records of everything they already knew.',
      counter:
        'The party claiming an exclusion has to be able to show it. We can accept dated records or the testimony of the employee concerned.',
    },
  },
  { number: 6, title: 'Compelled disclosure', page: 3, span: [84, 172], change: null },
  {
    number: 7,
    title: 'Term and survival',
    page: 3,
    span: [200, 305],
    change: {
      segs: [
        ['plain', '...during the period of '],
        ['del', 'twelve (12) months'],
        ['ins', 'twenty-four (24) months'],
        ['plain', ' from the Effective Date... The obligations in clauses 3 to 5 continue for '],
        ['del', 'five (5) years'],
        ['ins', 'three (3) years'],
        ['plain', ' after the date of each disclosure...'],
      ],
      comment:
        'A two-year window suits a packaging trial. Five years of secrecy is long for supplier pricing, three is market.',
      counter:
        'Two years of disclosure is fine. Survival stays at five years: the cold-brew formulations will still be sensitive then. We can offer three years for pricing information only.',
    },
  },
  {
    number: 8,
    title: 'Return or destruction',
    page: 3,
    span: [333, 421],
    change: {
      segs: [
        ['plain', '...shall '],
        ['del', 'promptly'],
        ['ins', 'within thirty (30) days'],
        ['plain', ' return or destroy all Confidential Information... '],
        [
          'ins',
          ', except that it may keep copies held in routine electronic back-ups or required by law, which remain subject to this Agreement',
        ],
      ],
      comment: 'Our back-ups roll off after 90 days, we cannot delete single files from them.',
      counter: '',
    },
  },
  { number: 9, title: 'No licence', page: 4, span: [84, 172], change: null },
  {
    number: 10,
    title: 'Remedies',
    page: 4,
    span: [200, 288],
    change: {
      segs: [
        ['plain', '...entitled to seek injunctive relief '],
        ['del', 'without proof of actual damage and without the posting of a bond'],
        ['plain', '. '],
        [
          'ins',
          'Neither party is liable to the other under this Agreement for indirect or consequential loss, or for loss of profit.',
        ],
      ],
      comment:
        'Our insurers need the injunction wording to match English practice, and the cap is standard for us.',
      counter:
        'We will drop the bond waiver but not the exclusion of loss: a leak of a formulation is exactly consequential loss. Please remove the new last sentence.',
    },
  },
  {
    number: 11,
    title: 'Governing law and courts',
    page: 4,
    span: [316, 404],
    change: {
      segs: [
        ['plain', '...governed by the laws of '],
        ['del', 'the State of Delaware'],
        ['ins', 'England and Wales'],
        ['plain', ', and the parties submit to the exclusive jurisdiction of the '],
        ['del', 'state and federal courts located in New Castle County, Delaware'],
        ['ins', 'courts of England and Wales'],
      ],
      comment: 'We are an English company and our board will not sign under foreign law.',
      counter:
        'We cannot move this one. Neutral ground would work for us: New York law and courts, or Delaware as drafted.',
    },
  },
  {
    number: 12,
    title: 'General',
    page: 5,
    span: [84, 189],
    change: {
      segs: [
        ['plain', "...without the other's written consent"],
        [
          'ins',
          ', except to an affiliate or a successor to all or substantially all of its business, on written notice',
        ],
        ['plain', '. A provision held unenforceable is severed...'],
      ],
      comment: 'Standard carve-out so a group reorganisation does not need your sign-off.',
      counter: 'Agreed, it applies to both of us.',
    },
  },
];

// Stable reference: the viewer keeps its scroll position across the app's own re-renders
const VIEWER_CLASSES = {
  root: classes.root,
  toolbar: classes.toolbar,
  title: classes.title,
  control: classes.control,
  pageIndicator: classes.pageIndicator,
  zoomLevel: classes.zoomLevel,
  search: classes.search,
  body: classes.body,
  page: classes.page,
};

const CHANGED = CLAUSES.filter((clause) => clause.change);

function count(segs: Seg[], kind: Kind) {
  return segs.filter(([k]) => k === kind).length;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Needs your answer',
  accepted: 'Accepted',
  countered: 'Pushed back',
};

function StatusDot({ status }: { status: Status | 'unchanged' }) {
  return (
    <span className={classes.dot} data-status={status} aria-hidden>
      {status === 'accepted' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5.2l2 2 4-4.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === 'countered' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M3.6 2.4L1.6 4.4l2 2M2 4.4h4a2.4 2.4 0 010 4.8H4.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function Redline({ segs }: { segs: Seg[] }) {
  return (
    <p className={classes.redline}>
      {segs.map(([kind, value], index) =>
        kind === 'ins' ? (
          <ins key={index} className={classes.ins}>
            {value}
          </ins>
        ) : kind === 'del' ? (
          <del key={index} className={classes.del}>
            {value}
          </del>
        ) : (
          <span key={index}>{value}</span>
        )
      )}
    </p>
  );
}

/**
 * In-house counsel reviews a supplier NDA that came back from Northwind Supply with tracked
 * changes. They go clause by clause, accept or push back, and approve when nothing is open.
 * The app owns its light palette, it does not follow the Mantine colour scheme.
 */
export function Clause() {
  const [store, viewer] = useDocViewer();
  const [selected, setSelected] = useState(1);
  const [statuses, setStatuses] = useState<Record<number, Status>>(() =>
    Object.fromEntries(CHANGED.map((clause) => [clause.number, 'pending' as Status]))
  );
  const [replies, setReplies] = useState<Record<number, string>>(() =>
    Object.fromEntries(CHANGED.map((clause) => [clause.number, clause.change!.counter]))
  );
  const [approved, setApproved] = useState(false);
  // Which pane shows on a phone; the three sit side by side on larger screens
  const [pane, setPane] = useState<'clauses' | 'document' | 'clause'>('document');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const clause = CLAUSES.find((item) => item.number === selected)!;
  const status = statuses[selected];
  const resolved = CHANGED.filter((item) => statuses[item.number] !== 'pending').length;
  const countered = CHANGED.filter((item) => statuses[item.number] === 'countered').length;
  const allResolved = resolved === CHANGED.length;

  const select = (number: number) => {
    setSelected(number);
    setPane('document');
    const target = CLAUSES.find((item) => item.number === number)!;
    // A little above the clause, so its first line is not under the toolbar
    viewer.goToPage(target.page, { top: Math.max(target.span[0] - 24, 0) });
  };

  const nextOpen = useMemo(() => {
    const after = CHANGED.find(
      (item) => item.number > selected && statuses[item.number] === 'pending'
    );
    return after ?? CHANGED.find((item) => statuses[item.number] === 'pending');
  }, [selected, statuses]);

  const resolve = (value: Status) => {
    setStatuses((current) => ({ ...current, [selected]: value }));
    setToast(
      value === 'accepted'
        ? `Accepted the change to clause ${selected}`
        : `Pushed back on clause ${selected}`
    );
  };

  // Scrolling the contract to another page follows to the first clause there
  const handlePageChange = (page: number) => {
    setSelected((current) => {
      const currentClause = CLAUSES.find((item) => item.number === current)!;
      if (currentClause.page === page) {
        return current;
      }
      const onPage = CLAUSES.filter((item) => item.page === page);
      return (onPage.find((item) => item.change) ?? onPage[0])?.number ?? current;
    });
  };

  const approve = () => {
    setApproved(true);
    setToast('Approved the NDA');
  };

  return (
    <div className={classes.app} data-mantine-color-scheme="light">
      <header className={classes.header}>
        <div className={classes.brand}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <rect width="22" height="22" rx="5" fill="#152238" />
            <path
              d="M6.2 7.2h6.6M6.2 11h9.6"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M6.2 14.8h5" stroke="#5ec58b" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Clause
        </div>
        <div className={classes.matter}>
          <span className={classes.matterName}>Mutual NDA with Northwind Supply</span>
          <span className={classes.version}>
            Version 3, sent by Northwind Supply on 12 November
          </span>
        </div>
        <div className={classes.progress}>
          <div className={classes.progressText}>
            {approved ? 'NDA approved' : `${resolved} of ${CHANGED.length} changes answered`}
          </div>
          <div className={classes.segments} aria-hidden>
            {CHANGED.map((item) => (
              <span key={item.number} data-status={statuses[item.number]} />
            ))}
          </div>
        </div>
        <Button
          className={classes.approve}
          onClick={approve}
          data-approved={approved || undefined}
          disabled={!allResolved || approved}
          title={allResolved ? undefined : 'Answer every change first'}
        >
          {approved
            ? 'Approved'
            : countered > 0 && allResolved
              ? 'Return v4 to Northwind'
              : 'Approve NDA'}
        </Button>
      </header>

      <div className={classes.panes} data-pane={pane}>
        <nav className={classes.clauses} aria-label="Clauses">
          <h2 className={classes.paneTitle}>Clauses</h2>
          <ol className={classes.clauseList}>
            {CLAUSES.map((item) => {
              const rowStatus = item.change ? statuses[item.number] : 'unchanged';
              return (
                <li key={item.number}>
                  <button
                    type="button"
                    className={classes.clauseRow}
                    data-active={item.number === selected || undefined}
                    data-status={rowStatus}
                    onClick={() => select(item.number)}
                  >
                    <span className={classes.clauseNumber}>{item.number}</span>
                    <span className={classes.clauseBody}>
                      <span className={classes.clauseTitle}>{item.title}</span>
                      <span className={classes.clauseMarks}>
                        {item.change ? (
                          <>
                            <span className={classes.plus}>+{count(item.change.segs, 'ins')}</span>
                            <span className={classes.minus}>
                              &minus;{count(item.change.segs, 'del')}
                            </span>
                          </>
                        ) : (
                          <span className={classes.untouched}>No changes</span>
                        )}
                      </span>
                    </span>
                    <StatusDot status={rowStatus} />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className={classes.viewer}>
          <DocViewer.Root
            src="/stories/nda.pdf"
            fileName="Mutual NDA, version 3.pdf"
            store={store}
            size="xs"
            color="#152238"
            radius={0}
            onPageChange={handlePageChange}
            classNames={VIEWER_CLASSES}
            // MISSING: reading the PDF's tracked changes as data (author, range, text) so the clause list would not need to repeat them.
          >
            <DocViewer.Toolbar tooltipProps={{ openDelay: 400 }}>
              <DocViewer.PageControls />
              <DocViewer.ZoomControls />
              <DocViewer.SearchButton />
              <DocViewer.PrintButton />
              <DocViewer.DownloadButton />
            </DocViewer.Toolbar>
            <DocViewer.Search />
            <DocViewer.Main>
              {/* A rail beside each changed clause, in the colour of its answer: select it from the page */}
              <DocViewer.Pages
                gap="md"
                renderPageOverlay={({ page, scale }) =>
                  CHANGED.filter((item) => item.page === page).map((item) => {
                    const itemStatus = statuses[item.number];
                    const [top, bottom] = item.span;
                    const active = item.number === selected || undefined;
                    const box = { top: top * scale, height: (bottom - top) * scale };
                    return (
                      <Fragment key={item.number}>
                        <div
                          className={classes.wash}
                          data-status={itemStatus}
                          data-active={active}
                          style={{ ...box, left: 70 * scale, width: (612 - 140) * scale }}
                        />
                        <button
                          type="button"
                          className={classes.rail}
                          data-status={itemStatus}
                          data-active={active}
                          aria-label={`Clause ${item.number}, ${STATUS_LABEL[itemStatus]}`}
                          aria-pressed={item.number === selected}
                          onClick={() => {
                            setSelected(item.number);
                            setPane('clause');
                          }}
                          style={{ ...box, left: 44 * scale, width: 22 * scale }}
                        >
                          <StatusDot status={itemStatus} />
                        </button>
                      </Fragment>
                    );
                  })
                }
              />
            </DocViewer.Main>
          </DocViewer.Root>
        </main>

        <aside className={classes.thread} aria-label={`Clause ${selected}`}>
          <div className={classes.threadHead}>
            <div className={classes.threadNumber}>Clause {clause.number}</div>
            <h2 className={classes.threadTitle}>{clause.title}</h2>
            {clause.change && (
              <div className={classes.statusChip} data-status={status}>
                <StatusDot status={status} />
                {STATUS_LABEL[status]}
              </div>
            )}
          </div>

          {clause.change ? (
            <div className={classes.threadBody}>
              <section className={classes.card}>
                <div className={classes.byline}>
                  <span className={classes.avatar}>DW</span>
                  <div>
                    <div className={classes.person}>Dana Whitfield</div>
                    <div className={classes.role}>Northwind Supply, 12 November, 09:40</div>
                  </div>
                </div>
                <Redline segs={clause.change.segs} />
                <p className={classes.comment}>{clause.change.comment}</p>
                <div className={classes.legend}>
                  <span className={classes.plus}>
                    {plural(count(clause.change.segs, 'ins'), 'insertion')}
                  </span>
                  <span className={classes.minus}>
                    {plural(count(clause.change.segs, 'del'), 'deletion')}
                  </span>
                </div>
              </section>

              {status === 'pending' ? (
                <>
                  <Textarea
                    label="Your reply to Northwind"
                    placeholder="Write a reply to push back instead"
                    classNames={{ label: classes.fieldLabel, input: classes.field }}
                    autosize
                    minRows={3}
                    maxRows={8}
                    value={replies[selected]}
                    onChange={(event) =>
                      setReplies((current) => ({
                        ...current,
                        [selected]: event.currentTarget.value,
                      }))
                    }
                  />
                  <div className={classes.actions}>
                    <Button className={classes.accept} onClick={() => resolve('accepted')}>
                      Accept change
                    </Button>
                    <Button
                      className={classes.pushBack}
                      variant="default"
                      disabled={!replies[selected].trim()}
                      onClick={() => resolve('countered')}
                    >
                      Push back
                    </Button>
                  </div>
                </>
              ) : (
                <section className={classes.card} data-you>
                  <div className={classes.byline}>
                    <span className={classes.avatar} data-you>
                      PR
                    </span>
                    <div>
                      <div className={classes.person}>You</div>
                      <div className={classes.role}>Priya Raman, Halden Labs, just now</div>
                    </div>
                  </div>
                  <p className={classes.reply}>
                    {status === 'accepted' ? 'Accepted the change as drafted.' : replies[selected]}
                  </p>
                  <div className={classes.actions}>
                    {nextOpen && (
                      <Button className={classes.accept} onClick={() => select(nextOpen.number)}>
                        Next open one
                      </Button>
                    )}
                    <Button
                      className={classes.pushBack}
                      variant="default"
                      disabled={approved}
                      onClick={() =>
                        setStatuses((current) => ({ ...current, [selected]: 'pending' }))
                      }
                    >
                      Reopen
                    </Button>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className={classes.threadBody}>
              <p className={classes.untouchedNote}>
                Northwind did not change this clause. It reads as in version 2, which you agreed.
              </p>
              {nextOpen && (
                <Button className={classes.accept} onClick={() => select(nextOpen.number)}>
                  Go to clause {nextOpen.number}
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      <SegmentedControl
        className={classes.tabs}
        classNames={{ indicator: classes.tabIndicator, label: classes.tabLabel }}
        aria-label="Show"
        fullWidth
        radius={0}
        value={pane}
        onChange={(value) => setPane(value as typeof pane)}
        data={[
          { value: 'clauses', label: 'Clauses' },
          { value: 'document', label: 'Document' },
          { value: 'clause', label: `Clause ${selected}` },
        ]}
      />

      {toast && (
        <div className={classes.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

Clause.storyName = 'Clause';
Clause.parameters = {
  docs: {
    description: {
      story:
        'In-house counsel reviews a supplier NDA that came back from Northwind Supply with tracked changes. They go clause by clause, accept or push back, and approve when nothing is open. The app owns its light palette, it does not follow the Mantine colour scheme.',
    },
  },
};
