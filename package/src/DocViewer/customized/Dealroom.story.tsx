import { Avatar, Button, Menu, Textarea } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';
import classes from './Dealroom.module.css';

export default {
  title: 'DocViewer/Apps/Dealroom (contract review)',
  parameters: { layout: 'fullscreen' },
};

type Status = 'in-review' | 'changes' | 'approved';

interface Person {
  name: string;
  role: string;
  initials: string;
}

interface Reply {
  id: string;
  author: Person;
  time: string;
  text: string;
}

interface Thread {
  id: string;
  /** Title of the PDF outline entry the comment belongs to */
  section: string;
  page: number;
  /** Where the comment is pinned on its page, in PDF points from the top; new comments have no pin */
  top?: number;
  author: Person;
  time: string;
  text: string;
  /** Set on comments that flag a commercial risk; `find` is what "Show clause" searches for */
  risk?: { label: string; find: string };
  resolved: boolean;
  replies: Reply[];
}

interface Section {
  title: string;
  page: number;
}

const MAYA: Person = { name: 'Maya Chen', role: 'Deal desk', initials: 'MC' };
const TOMAS: Person = { name: 'Tomas Reyes', role: 'Account executive', initials: 'TR' };
const PRIYA: Person = { name: 'Priya Raman', role: 'Legal counsel', initials: 'PR' };
const DANIEL: Person = { name: 'Daniel Okafor', role: 'Finance', initials: 'DO' };

// The figures and section pages mirror scripts/story-pdfs/msa.ts
const LIST_ARR = 618_000;
const DISCOUNT = 0.22;
const REP_LIMIT = 0.2;
const TERM_MONTHS = 36;
const ARR = Math.round(LIST_ARR * (1 - DISCOUNT));

const INITIAL_THREADS: Thread[] = [
  {
    id: 'discount',
    section: 'Fees and payment',
    page: 5,
    top: 234,
    author: DANIEL,
    time: 'Yesterday, 4:12 pm',
    text: 'At 22% this is over the 20% rep limit, so it needs deal desk approval. The clawback in 3.2 covers an early exit, which was the protection I wanted.',
    risk: { label: 'Discount is above the rep limit', find: 'discount of 22%' },
    resolved: false,
    replies: [
      {
        id: 'discount-1',
        author: TOMAS,
        time: 'Yesterday, 5:40 pm',
        text: 'Their CFO would not go below 22% for a 36-month commitment. They are comparing us with a competing bid.',
      },
    ],
  },
  {
    id: 'terms',
    section: 'Fees and payment',
    page: 5,
    top: 406,
    author: PRIYA,
    time: 'Yesterday, 2:05 pm',
    text: "Brightline's redline moved 3.3 from net 30 to net 60. Policy is net 30, or net 45 with VP Finance sign-off, so this is an exception.",
    risk: { label: 'Payment terms are outside policy', find: 'net 60' },
    resolved: false,
    replies: [
      {
        id: 'terms-1',
        author: DANIEL,
        time: 'Yesterday, 4:20 pm',
        text: 'Net 60 on a $482,040 invoice costs about $3,200 a year at our 8% cost of capital. I can accept it if the discount stays at 22%, not both.',
      },
    ],
  },
  {
    id: 'sla',
    section: 'Services',
    page: 3,
    top: 277,
    author: TOMAS,
    time: 'Tue, 11:30 am',
    text: '99.9% uptime and the 5, 10 and 25% credit ladder match our standard SLA. Nothing changed from the template.',
    resolved: true,
    replies: [],
  },
  {
    id: 'renewal',
    section: 'Fees and payment',
    page: 6,
    top: 151,
    author: TOMAS,
    time: 'Wed, 9:15 am',
    text: 'The renewal uplift is capped at 5% in 3.7. Brightline asked for 3%, but I would hold at 5%.',
    resolved: false,
    replies: [],
  },
  {
    id: 'liability',
    section: 'Liability',
    page: 8,
    top: 216,
    author: PRIYA,
    time: 'Wed, 3:48 pm',
    text: 'Both caps are mutual at 12 months of fees, with a 2x cap for data incidents. That is inside the playbook, so I am happy to accept it.',
    resolved: false,
    replies: [],
  },
  {
    id: 'dpa',
    section: 'Data protection',
    page: 9,
    top: 250,
    author: PRIYA,
    time: 'Thu, 10:02 am',
    text: "The SCCs and the data protection addendum are attached as Schedule 2, which covers Brightline's depots in Rotterdam and Dublin.",
    resolved: true,
    replies: [],
  },
];

const STATUS_LABEL: Record<Status, string> = {
  'in-review': 'In review',
  changes: 'Changes requested',
  approved: 'Approved',
};

function money(value: number) {
  return `$${value.toLocaleString('en-US')}`;
}

function sectionOf(sections: Section[], page: number) {
  return sections.reduce<Section | undefined>(
    (found, section) => (section.page <= page ? section : found),
    undefined
  );
}

function Icon({ name }: { name: 'chevron' | 'check' | 'flag' }) {
  const paths = {
    chevron: <path d="M4 6l4 4 4-4" />,
    check: <path d="M3.5 8.5l3 3 6-7" />,
    flag: <path d="M4 14V2.5m0 0h7l-1.5 3 1.5 3H4" />,
  };
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

function Initials({ person, size = 24 }: { person: Person; size?: number }) {
  return (
    <Avatar size={size} radius="xl" className={classes.avatar} title={person.name}>
      {person.initials}
    </Avatar>
  );
}

/**
 * A deal desk at a software company reviews a customer's master services agreement before it
 * goes out for signature: sections to navigate, comments from legal and finance, and a deal
 * rail that shows the money and the two commercial risks the contract contains.
 */
export function Dealroom() {
  const controller = useRef<DocViewerController>(null);
  const [page, setPage] = useState(1);
  // Sections come from the PDF's own outline
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState<Status>('in-review');
  const [discountApproved, setDiscountApproved] = useState(false);
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'risk' } | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const current = sectionOf(sections, page);
  const openThreads = threads.filter((thread) => !thread.resolved);
  const openRisks = openThreads.filter((thread) => thread.risk);
  const visible = useMemo(
    () =>
      threads
        .filter((thread) => thread.resolved === (tab === 'resolved'))
        .sort((a, b) => a.page - b.page),
    [threads, tab]
  );
  const approved = status === 'approved';

  // A pin on the page opens its comment in the thread rail
  const openThread = (thread: Thread) => {
    setTab('open');
    window.requestAnimationFrame(() => {
      const card = document.getElementById(`dealroom-thread-${thread.id}`);
      card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      card?.focus({ preventScroll: true });
    });
  };

  const showClause = (thread: Thread) => {
    controller.current?.goToPage(thread.page);
    if (thread.risk) {
      controller.current?.openSearch(thread.risk.find);
    }
  };

  const setResolved = (id: string, resolved: boolean) =>
    setThreads((all) => all.map((thread) => (thread.id === id ? { ...thread, resolved } : thread)));

  const approveDiscount = () => {
    setDiscountApproved(true);
    setThreads((all) =>
      all.map((thread) =>
        thread.id === 'discount'
          ? {
              ...thread,
              resolved: true,
              replies: [
                ...thread.replies,
                {
                  id: 'discount-approved',
                  author: MAYA,
                  time: 'Just now',
                  text: 'Approved a 22% discount on a 36-month commitment, with the clawback in 3.2.',
                },
              ],
            }
          : thread
      )
    );
    setToast({ text: 'Discount approved', tone: 'ok' });
  };

  const approveDeal = () => {
    const blockers: string[] = [];
    if (!discountApproved) {
      blockers.push('the discount is not approved');
    }
    const risks = openRisks.length;
    if (risks) {
      blockers.push(`${risks} open ${risks === 1 ? 'risk' : 'risks'}`);
    }
    if (blockers.length) {
      setToast({ text: `Cannot approve yet: ${blockers.join(' and ')}`, tone: 'risk' });
      return;
    }
    setStatus('approved');
    setToast({ text: 'Deal approved', tone: 'ok' });
  };

  const addComment = () => {
    const text = draft.trim();
    if (!text || !current) {
      return;
    }
    setThreads((all) => [
      ...all,
      {
        id: `new-${all.length}`,
        section: current.title,
        page,
        author: MAYA,
        time: 'Just now',
        text,
        resolved: false,
        replies: [],
      },
    ]);
    setTab('open');
    setDraft('');
    setToast({ text: 'Comment added', tone: 'ok' });
  };

  return (
    <div className={classes.app}>
      <header className={classes.header}>
        <div className={classes.brand}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <rect width="22" height="22" rx="6" fill="var(--dr-violet-solid)" />
            <path d="M7.5 5.5h4a5.5 5.5 0 010 11h-4z" fill="#fff" />
          </svg>
          Dealroom
        </div>
        <nav className={classes.crumbs} aria-label="Breadcrumb">
          <span>Deals</span>
          <span aria-hidden>/</span>
          <span>Brightline Freight</span>
          <span aria-hidden>/</span>
          <strong>Master services agreement</strong>
        </nav>
        <div className={classes.headerEnd}>
          <Button.Group>
            <Button
              size="sm"
              radius={8}
              color="#5b4cdb"
              className={classes.approve}
              disabled={approved}
              leftSection={approved ? <Icon name="check" /> : undefined}
              onClick={approveDeal}
            >
              {approved ? 'Approved' : 'Approve deal'}
            </Button>
            <Menu position="bottom-end" withinPortal={false} width={200} radius={8}>
              <Menu.Target>
                <Button
                  size="sm"
                  radius={8}
                  color="#5b4cdb"
                  className={classes.approveMenu}
                  aria-label="More decisions"
                >
                  <Icon name="chevron" />
                </Button>
              </Menu.Target>
              <Menu.Dropdown className={classes.menu}>
                {approved ? (
                  <Menu.Item
                    onClick={() => {
                      setStatus('in-review');
                      setToast({ text: 'Review reopened', tone: 'ok' });
                    }}
                  >
                    Reopen review
                  </Menu.Item>
                ) : (
                  <>
                    <Menu.Item
                      onClick={() => {
                        setStatus('changes');
                        setToast({ text: 'Changes requested', tone: 'ok' });
                      }}
                    >
                      Request changes
                    </Menu.Item>
                    <Menu.Item onClick={() => setToast({ text: 'Sent to legal', tone: 'ok' })}>
                      Send to legal
                    </Menu.Item>
                  </>
                )}
                <Menu.Divider />
                <Menu.Item onClick={() => setToast({ text: 'Owner reassigned', tone: 'ok' })}>
                  Reassign owner
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Button.Group>
        </div>
      </header>

      <div className={classes.shell}>
        <aside className={classes.rail} aria-label="Deal summary">
          <div>
            <h2 className={classes.customer}>Brightline Freight</h2>
            <p className={classes.customerNote}>New business, Memphis, Tennessee</p>
          </div>

          <dl className={classes.facts}>
            <div>
              <dt>Stage</dt>
              <dd>Contract review</dd>
            </div>
            <div>
              <dt>Closes</dt>
              <dd>30 Nov 2026</dd>
            </div>
          </dl>

          <div className={classes.money}>
            <span className={classes.label}>Annual recurring revenue</span>
            <span className={classes.arr}>{money(ARR)}</span>
            <span className={classes.list}>
              <s>{money(LIST_ARR)}</s> list price
            </span>
          </div>

          <dl className={classes.terms}>
            <div>
              <dt>Contract value</dt>
              <dd>{money(ARR * (TERM_MONTHS / 12))}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>{TERM_MONTHS} months</dd>
            </div>
            <div>
              <dt>Users</dt>
              <dd>140</dd>
            </div>
            <div>
              <dt>Payment terms</dt>
              <dd data-risk={openRisks.some((thread) => thread.id === 'terms') || undefined}>
                Net 60
                <span className={classes.policy}>policy is net 30</span>
              </dd>
            </div>
          </dl>

          <section className={classes.discount} aria-label="Discount approval">
            <div className={classes.discountHead}>
              <span className={classes.label}>Discount</span>
              <span className={classes.discountValue}>{Math.round(DISCOUNT * 100)}%</span>
            </div>
            <div
              className={classes.gauge}
              data-approved={discountApproved || undefined}
              role="img"
              aria-label={`Discount ${DISCOUNT * 100}%, the rep limit is ${REP_LIMIT * 100}%`}
            >
              <span
                className={classes.gaugeBase}
                style={{ width: `${(REP_LIMIT / 0.3) * 100}%` }}
              />
              <span
                className={classes.gaugeOver}
                style={{
                  left: `${(REP_LIMIT / 0.3) * 100}%`,
                  width: `${((DISCOUNT - REP_LIMIT) / 0.3) * 100}%`,
                }}
              />
              <span className={classes.gaugeLimit} style={{ left: `${(REP_LIMIT / 0.3) * 100}%` }}>
                <span className={classes.gaugeLimitLabel}>Rep limit 20%</span>
              </span>
            </div>
            <p className={classes.discountState} data-approved={discountApproved || undefined}>
              {discountApproved
                ? 'Approved by Maya Chen on a 36-month commitment.'
                : `${money(LIST_ARR - ARR)} off list a year. Needs deal desk approval.`}
            </p>
            {!discountApproved && (
              <Button
                size="xs"
                radius={8}
                variant="default"
                className={classes.railButton}
                onClick={approveDiscount}
              >
                Approve discount
              </Button>
            )}
          </section>

          <section aria-label="Open risks">
            <h3 className={classes.railHeading}>Open risks</h3>
            {openRisks.length === 0 ? (
              <p className={classes.quiet}>No open risks.</p>
            ) : (
              <ul className={classes.risks}>
                {openRisks.map((thread) => (
                  <li key={thread.id}>
                    <Icon name="flag" />
                    <div>
                      <span>{thread.risk?.label}</span>
                      <button
                        type="button"
                        className={classes.link}
                        onClick={() => showClause(thread)}
                      >
                        Show in agreement, page {thread.page}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Deal team" className={classes.team}>
            <h3 className={classes.railHeading}>Deal team</h3>
            <ul>
              {[TOMAS, MAYA, PRIYA, DANIEL].map((person) => (
                <li key={person.name}>
                  <Initials person={person} size={26} />
                  <span>
                    {person.name}
                    <small>{person.role}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className={classes.main}>
          <nav className={classes.sections} aria-label="Agreement sections">
            {sections.map((section) => {
              const open = openThreads.filter((thread) => thread.section === section.title).length;
              return (
                <button
                  key={section.page}
                  type="button"
                  className={classes.section}
                  title={`Page ${section.page}`}
                  data-active={current?.page === section.page || undefined}
                  onClick={() => controller.current?.goToPage(section.page)}
                >
                  {section.title}
                  {open > 0 && (
                    <span className={classes.sectionCount} aria-label={`${open} open comments`}>
                      {open}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <DocViewer
            src="/stories/msa.pdf"
            fileName="Master services agreement.pdf"
            pdfWorkerSrc={pdfWorkerSrc}
            controllerRef={controller}
            page={page}
            onPageChange={setPage}
            onDocumentLoad={async () => {
              const outline = (await controller.current?.getOutline()) ?? [];
              setSections(
                outline.flatMap((entry) =>
                  entry.page === null ? [] : [{ title: entry.title, page: entry.page }]
                )
              );
            }}
            size="xs"
            color="#5b4cdb"
            radius={8}
            pageGap="md"
            matchColor="#d6d0fb"
            activeMatchColor="#9d92f4"
            // Pages follow the Mantine colour scheme too, inverted in dark mode
            pageColorScheme="auto"
            defaultZoom="fit"
            withFullscreen={false}
            toolbarControls={{
              rotate: false,
              layout: false,
              presentation: false,
              info: false,
            }}
            tooltipProps={{ openDelay: 400, position: 'bottom' }}
            classNames={{
              root: classes.root,
              toolbar: classes.toolbar,
              title: classes.title,
              subtitle: classes.subtitle,
              control: classes.control,
              pageIndicator: classes.pageIndicator,
              zoomLevel: classes.zoomLevel,
              search: classes.search,
              searchInput: classes.searchInput,
              body: classes.body,
              page: classes.page,
            }}
            // The file name is the breadcrumb in the header, so the toolbar names the draft instead
            renderToolbarTitle={() => 'Draft 4'}
            toolbarSubtitle={approved ? 'Redline accepted' : 'Redline in review'}
            toolbarStartSection={
              <span className={classes.draftMark} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 1.75h5l3 3v9.5H4zM9 1.75v3h3M6 8.25h4M6 10.75h4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            }
            toolbarSection={
              <span className={classes.status} data-status={status}>
                {STATUS_LABEL[status]}
              </span>
            }
            // MISSING: onTextSelect(text, page, rects) so legal can select a clause and comment on that text.
            // Open comments are pinned in the right margin beside their clause; risks in orange
            renderPageOverlay={({ pageNumber, scale }) =>
              openThreads
                .filter((thread) => thread.page === pageNumber && thread.top !== undefined)
                .map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    className={classes.pin}
                    data-risk={!!thread.risk || undefined}
                    style={{ top: (thread.top! - 15) * scale, left: 552 * scale }}
                    aria-label={`${thread.risk ? `Risk: ${thread.risk.label}` : 'Comment'} from ${thread.author.name}`}
                    onClick={() => openThread(thread)}
                  >
                    {thread.risk ? <Icon name="flag" /> : thread.author.initials}
                    {thread.replies.length > 0 && (
                      <span className={classes.pinCount} aria-hidden>
                        {thread.replies.length + 1}
                      </span>
                    )}
                  </button>
                ))
            }
            // MISSING: highlighting a clause from outside; "Show in agreement" can only search for it.
          />
        </main>

        <aside className={classes.threads} aria-label="Comments">
          <div className={classes.threadsHead}>
            <h2>Comments</h2>
            <div className={classes.tabs} role="group" aria-label="Show">
              <button type="button" aria-pressed={tab === 'open'} onClick={() => setTab('open')}>
                Open <span>{openThreads.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={tab === 'resolved'}
                onClick={() => setTab('resolved')}
              >
                Resolved <span>{threads.length - openThreads.length}</span>
              </button>
            </div>
          </div>

          <div className={classes.threadList}>
            {visible.length === 0 && (
              <p className={classes.empty}>
                {tab === 'open' ? 'Nothing left to resolve.' : 'No resolved comments yet.'}
              </p>
            )}
            {visible.map((thread) => (
              <article
                key={thread.id}
                id={`dealroom-thread-${thread.id}`}
                tabIndex={-1}
                className={classes.thread}
                data-current={current?.title === thread.section || undefined}
                data-resolved={thread.resolved || undefined}
              >
                <button type="button" className={classes.anchor} onClick={() => showClause(thread)}>
                  {thread.section}, page {thread.page}
                </button>
                {thread.risk && !thread.resolved && (
                  <span className={classes.riskTag}>
                    <Icon name="flag" />
                    {thread.risk.label}
                  </span>
                )}
                {[
                  { id: thread.id, author: thread.author, time: thread.time, text: thread.text },
                  ...thread.replies,
                ].map((message) => (
                  <div key={message.id} className={classes.message}>
                    <Initials person={message.author} />
                    <div>
                      <div className={classes.byline}>
                        <strong>{message.author.name}</strong>
                        <span>{message.time}</span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
                <div className={classes.threadActions}>
                  <button
                    type="button"
                    className={classes.link}
                    onClick={() => setResolved(thread.id, !thread.resolved)}
                  >
                    {thread.resolved ? 'Reopen' : 'Resolve'}
                  </button>
                  {thread.risk && !thread.resolved && (
                    <button
                      type="button"
                      className={classes.link}
                      onClick={() => showClause(thread)}
                    >
                      Show clause
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <form
            className={classes.composer}
            onSubmit={(event) => {
              event.preventDefault();
              addComment();
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  addComment();
                }
              }}
              placeholder={current ? `Comment on ${current.title}` : 'Add a comment'}
              aria-label="Comment"
              autosize
              minRows={2}
              maxRows={5}
              radius={8}
              classNames={{ input: classes.composerInput }}
            />
            <div className={classes.composerFoot}>
              <span>{current ? `Page ${page}` : ''}</span>
              <Button type="submit" size="xs" radius={8} color="#5b4cdb" disabled={!draft.trim()}>
                Comment
              </Button>
            </div>
          </form>
        </aside>
      </div>

      {toast && (
        <div className={classes.toast} data-tone={toast.tone} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
