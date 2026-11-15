import { Button, Checkbox, Textarea } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
import classes from './Proofline.module.css';

export default {
  title: 'DocViewer/Apps/Proofline (print proof approval)',
  parameters: { layout: 'fullscreen' },
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
  const controller = useRef<DocViewerController>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [toast, setToast] = useState<string | null>(null);

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
            pdfWorkerSrc={pdfWorkerSrc}
            controllerRef={controller}
            size="xs"
            radius={0}
            color="gray"
            // A proof shows true colours, whatever the colour scheme
            pageColorScheme="light"
            defaultPageLayout="two-page"
            defaultZoom="fit"
            // Room between the pages for the crop marks and the labels
            pageGap={56}
            withPrint={false}
            withDownload={false}
            tooltipProps={{ openDelay: 400, position: 'bottom' }}
            toolbarControls={{
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
            // MISSING: a layer above each page for proof overlays (bleed, trim and safe boxes read from the PDF) that scales with the page.
            // MISSING: a slot beside or below a page for slug text such as "Front, page 1 of 2" without CSS pseudo-elements on the page part.
            // MISSING: padding for the pages part that fit-to-width zoom knows about, so marks outside the page never cause a horizontal scrollbar.
          />
          <ul className={classes.legend} aria-label="Proof marks">
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
                      onClick={() => controller.current?.goToPage(2)}
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
