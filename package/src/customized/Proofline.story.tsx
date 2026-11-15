import { Button, Checkbox, Switch, Textarea, useMatches } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useState } from 'react';
import {
  createPdfJsAdapter,
  DocViewer,
  DocViewerAdapterProvider,
  useDocViewer,
  type DocViewerPageLayout,
} from '../index';
import classes from './Proofline.module.css';

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });

export default {
  title: 'DocViewer/Apps/Proofline (print proof approval)',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story: React.ComponentType) => (
      <DocViewerAdapterProvider pdf={pdfAdapter}>
        <Story />
      </DocViewerAdapterProvider>
    ),
  ],
};

const CHECKS = [
  { id: 'bleed', label: 'Artwork reaches the bleed edge on both sides' },
  {
    id: 'safe',
    label: 'Text is inside the safe area',
    warning: 'The web address on the back is 1.8 mm from the trim, inside the 5 mm safe area.',
  },
  { id: 'prices', label: 'Prices and opening hours are right' },
  { id: 'spelling', label: 'Names and spelling are right' },
  { id: 'colour', label: 'Colours look as intended' },
] as const;

const JOB = [
  ['Product', 'A5 menu, two sides'],
  ['Trim size', '148 × 210 mm, 3 mm bleed'],
  ['Paper', '350 gsm silk, matt laminated'],
  ['Quantity', '500'],
  ['Price', '£186.00 + VAT'],
  ['Delivery', 'Fri 20 Nov'],
] as const;

// Overprints of the process inks, as a press check strip shows them
const COLOUR_BAR = [
  ['C', '#00a0dc'],
  ['M', '#e5007d'],
  ['Y', '#ffe100'],
  ['K', '#1e1e1e'],
  ['MY', '#e3001b'],
  ['CY', '#009e60'],
  ['CM', '#2e3192'],
] as const;

/** Proof geometry in PDF points, as scripts/story-pdfs/menu-proof.ts lays the menu out */
const MM = 72 / 25.4;
const BLEED = 3 * MM;
const SAFE = 5 * MM;
const PAGE_W = 148 * MM + 2 * BLEED;
const PAGE_H = 210 * MM + 2 * BLEED;
/** Crop marks: their gap from the bleed edge and their length */
const CROP_GAP = 4;
const CROP_LENGTH = 12;

const SLUGS = ['Front, page 1 of 2', 'Back, page 2 of 2'];

/** Text the printer flagged: the web address on the back, 1.8 mm from the trim */
const FLAG = { page: 2, x: 26, y: PAGE_H - BLEED - 15, width: 196, height: 13 };

/** Crop marks outside the bleed, in line with the trim on every edge */
function cropMarks() {
  const lines: string[] = [];
  const out = -CROP_GAP;
  const far = -CROP_GAP - CROP_LENGTH;
  [BLEED, PAGE_W - BLEED].forEach((x) => {
    lines.push(`M${x} ${out}V${far}`, `M${x} ${PAGE_H - out}V${PAGE_H - far}`);
  });
  [BLEED, PAGE_H - BLEED].forEach((y) => {
    lines.push(`M${out} ${y}H${far}`, `M${PAGE_W - out} ${y}H${PAGE_W - far}`);
  });
  return lines.join('');
}

function ProofMarks({ pageNumber, scale }: { pageNumber: number; scale: number }) {
  const trim = { x: BLEED, y: BLEED, w: PAGE_W - 2 * BLEED, h: PAGE_H - 2 * BLEED };
  return (
    <>
      <svg
        className={classes.marks}
        viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
        width={PAGE_W * scale}
        height={PAGE_H * scale}
        aria-hidden
      >
        <defs>
          <pattern
            id={`pl-hatch-${pageNumber}`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" className={classes.hatchLine} />
          </pattern>
        </defs>
        <path
          className={classes.bleed}
          fill={`url(#pl-hatch-${pageNumber})`}
          fillRule="evenodd"
          d={`M0 0H${PAGE_W}V${PAGE_H}H0Z M${trim.x} ${trim.y}v${trim.h}h${trim.w}v${-trim.h}Z`}
        />
        <rect className={classes.trim} x={trim.x} y={trim.y} width={trim.w} height={trim.h} />
        <rect
          className={classes.safe}
          x={trim.x + SAFE}
          y={trim.y + SAFE}
          width={trim.w - 2 * SAFE}
          height={trim.h - 2 * SAFE}
        />
        <path className={classes.crop} d={cropMarks()} />
      </svg>
      {FLAG.page === pageNumber && (
        <div
          className={classes.flag}
          role="note"
          style={{
            left: FLAG.x * scale,
            top: FLAG.y * scale,
            width: FLAG.width * scale,
            height: FLAG.height * scale,
          }}
        >
          <span className={classes.flagLabel}>1.8 mm from the trim</span>
        </div>
      )}
    </>
  );
}

type Outcome = { kind: 'approved' | 'changes'; at: string; note: string } | null;

function formatNow() {
  return new Date().toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * A café owner approves the proof of a new menu before 500 copies print: check the bleed and the
 * safe area on the cutting mat, then approve or ask for changes.
 *
 * The story owns its colours: a green cutting mat and a white job ticket, in light and dark.
 */
export function Proofline() {
  const [store, viewer] = useDocViewer();
  // One page at a time on a phone, the two sides together from Mantine's sm (48em) up
  const pageLayout = useMatches<DocViewerPageLayout>({ base: 'single', sm: 'two-page' });
  const [checked, setChecked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMarks, setShowMarks] = useState(true);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const allChecked = checked.length === CHECKS.length;

  const approve = () => {
    setOutcome({ kind: 'approved', at: formatNow(), note: '' });
    setToast('Approved for print');
  };

  const requestChanges = () => {
    setOutcome({ kind: 'changes', at: formatNow(), note: note.trim() });
    setToast('Changes requested');
  };

  const reopen = () => {
    setOutcome(null);
    setNote('');
  };

  return (
    <div className={classes.mat}>
      <header className={classes.header}>
        <div className={classes.brand}>
          <span className={classes.brandMark} aria-hidden />
          Proofline
        </div>
        <div className={classes.user}>
          Hana Lindqvist
          <span className={classes.avatar} aria-hidden>
            HL
          </span>
        </div>
      </header>

      <div className={classes.workspace}>
        <div className={classes.stage}>
          <DocViewer
            src="/stories/menu-proof.pdf"
            fileName="Little Wren menu, proof 2.pdf"
            store={store}
            size="xs"
            radius={0}
            color="gray"
            // A proof shows true colours, whatever the colour scheme
            pageColorScheme="light"
            pageLayout={pageLayout}
            defaultZoom="fit"
            toolbarProps={{ tooltipProps: { openDelay: 400, position: 'bottom' } }}
            toolbarControls={{
              print: false,
              download: false,
              thumbnails: false,
              outline: false,
              info: false,
              presentation: false,
              search: false,
              layout: false,
              rotate: false,
            }}
            classNames={{
              root: classes.root,
              toolbar: classes.toolbar,
              title: classes.title,
              control: classes.control,
              pageIndicator: classes.pageIndicator,
              zoomLevel: classes.zoomLevel,
              body: classes.body,
              pages: classes.pages,
              page: classes.page,
            }}
            // Proof marks and the slug line: drawn over each page, outside the PDF, so they can be hidden
            pagesProps={{
              // Room between the pages for the crop marks and the labels
              gap: 56,
              renderPageOverlay: ({ pageNumber, scale, height }) => (
                <>
                  {showMarks && <ProofMarks pageNumber={pageNumber} scale={scale} />}
                  <span className={classes.slug} style={{ top: height * scale + 22 }}>
                    {SLUGS[pageNumber - 1]}
                  </span>
                </>
              ),
            }}
          />
          <div className={classes.legendBar}>
            <Switch
              className={classes.marksSwitch}
              size="xs"
              color="pink"
              label="Proof marks"
              checked={showMarks}
              onChange={(event) => setShowMarks(event.currentTarget.checked)}
            />
            <ul
              className={classes.legend}
              aria-label="Key to the proof marks"
              data-hidden={!showMarks || undefined}
            >
              <li>
                <span className={classes.swatchBleed} aria-hidden />
                Bleed, 3 mm
              </li>
              <li>
                <span className={classes.swatchTrim} aria-hidden />
                Trim line
              </li>
              <li>
                <span className={classes.swatchSafe} aria-hidden />
                Safe area, 5 mm inside the trim
              </li>
              <li>
                <span className={classes.swatchCrop} aria-hidden />
                Crop marks
              </li>
            </ul>
          </div>
        </div>

        <aside className={classes.ticket} aria-label="Job ticket">
          <div className={classes.ticketHead}>
            <span className={classes.status} data-status={outcome?.kind ?? 'waiting'}>
              {outcome === null
                ? 'Waiting for your approval'
                : outcome.kind === 'approved'
                  ? 'Approved for print'
                  : 'Changes requested'}
            </span>
            <h1 className={classes.jobTitle}>Little Wren menu</h1>
            <p className={classes.jobSub}>Proof 2, sent Fri 13 Nov by Kestrel Print, Leeds</p>
          </div>

          <dl className={classes.jobList}>
            {JOB.map(([term, value]) => (
              <div key={term} className={classes.jobRow}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className={classes.inks}>
            <div
              className={classes.inkBar}
              role="img"
              aria-label="Colour bar: cyan, magenta, yellow, black and their overprints"
            >
              {COLOUR_BAR.map(([name, color]) => (
                <span key={name} style={{ background: color }} title={name} />
              ))}
            </div>
            <div className={classes.inkNames} aria-hidden>
              {COLOUR_BAR.map(([name]) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>

          <fieldset className={classes.checks} disabled={outcome !== null}>
            <legend className={classes.legendTitle}>Before you approve</legend>
            {CHECKS.map((check) => (
              <div key={check.id} className={classes.check}>
                <Checkbox
                  size="sm"
                  color="#2f6b53"
                  label={check.label}
                  checked={checked.includes(check.id)}
                  onChange={(event) => {
                    const { checked: isChecked } = event.currentTarget;
                    setChecked((current) =>
                      isChecked ? [...current, check.id] : current.filter((id) => id !== check.id)
                    );
                  }}
                  classNames={{ label: classes.checkLabel, input: classes.checkInput }}
                />
                {'warning' in check && !checked.includes(check.id) && (
                  <p className={classes.warning}>
                    {check.warning}{' '}
                    <button
                      type="button"
                      className={classes.link}
                      onClick={() => viewer.goToPage(2)}
                    >
                      Show on the back
                    </button>
                  </p>
                )}
              </div>
            ))}
          </fieldset>

          {outcome === null ? (
            <div className={classes.actions}>
              <Textarea
                label="Note for the print shop"
                placeholder="Move the web address up, 5 mm from the trim"
                autosize
                minRows={2}
                maxRows={4}
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                classNames={{ label: classes.fieldLabel, input: classes.field }}
              />
              <div className={classes.buttons}>
                <Button color="#2f6b53" radius={4} disabled={!allChecked} onClick={approve}>
                  Approve for print
                </Button>
                <Button
                  variant="default"
                  radius={4}
                  disabled={note.trim() === ''}
                  onClick={requestChanges}
                  className={classes.secondary}
                >
                  Request changes
                </Button>
              </div>
              <p className={classes.hint}>
                {allChecked
                  ? 'Approving sends 500 copies to press. It cannot be undone after 2 pm on Mon 16 Nov.'
                  : `Tick all ${CHECKS.length} checks to approve. Changes only need a note.`}
              </p>
            </div>
          ) : (
            <div className={classes.result} data-kind={outcome.kind}>
              <p className={classes.resultTitle}>
                {outcome.kind === 'approved' ? 'Approved for print' : 'Changes requested'}
              </p>
              <p className={classes.resultText}>
                {outcome.kind === 'approved'
                  ? `Kestrel Print will start on 500 copies. Approved ${outcome.at}. Delivery is still Fri 20 Nov.`
                  : `Sent ${outcome.at}. A new proof usually comes back within one working day.`}
              </p>
              {outcome.note && <blockquote className={classes.quote}>{outcome.note}</blockquote>}
              <button type="button" className={classes.link} onClick={reopen}>
                Reopen the proof
              </button>
            </div>
          )}
        </aside>
      </div>

      {toast && (
        <div className={classes.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
