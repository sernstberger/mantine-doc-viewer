import { Button, Checkbox, TextInput, UnstyledButton } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useState } from 'react';
import {
  createPdfJsAdapter,
  DocViewer,
  DocViewerAdapterProvider,
  useDocViewer,
  type DocViewerReadingProgress,
} from '../index';
import { createMarkupExtension, saveMarkup, type DocViewerMark } from '../markup';
import classes from './Haven.module.css';

const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc: pdfWorkerSrc });

export default {
  title: 'DocViewer/Apps/Haven (rental agreement checkout)',
  decorators: [
    (Story: React.ComponentType) => (
      <DocViewerAdapterProvider pdf={pdfAdapter}>
        <Story />
      </DocViewerAdapterProvider>
    ),
  ],
};

const PAGES = ['Parties and dates', 'House rules', 'Cancellation and damage', 'Signatures'];

/** A page counts as read once this much of it has been on screen */
const READ = 0.8;

const NIGHTS = 5;
const RATE = 214;
const CLEANING = 95;
const SERVICE = 148;

/** The guest's signature line on page 4, in PDF points from the page's top-left */
const SIGN_LINE = { x: 64, y: 492, width: 220 };

function money(value: number) {
  return `$${value.toLocaleString('en-US')}`;
}

/**
 * A guest booking a lake cabin must read the house agreement to the end and sign before
 * paying. The viewer reports how much of each page has been seen and when the end of the
 * last page is on screen; the booking card turns that into a reading meter and only then lets
 * the guest sign, by hand, on the agreement's own line.
 */
export function Haven() {
  const [store, viewer] = useDocViewer();
  const [progress, setProgress] = useState<DocViewerReadingProgress | null>(null);
  const [current, setCurrent] = useState(1);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [marks, setMarks] = useState<DocViewerMark[]>([]);
  const signature = marks.find((mark) => mark.type === 'signature');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const fractions = PAGES.map((_, index) => progress?.seen[index] ?? 0);
  const pagesRead = fractions.filter((fraction) => fraction >= READ).length;
  const readAll = !!progress?.reachedEnd && pagesRead === PAGES.length;
  const trimmed = name.trim();
  const canSign = readAll && trimmed.length > 1 && agreed && !!signature && !signed;
  const total = NIGHTS * RATE + CLEANING + SERVICE;

  let hint = 'Read to the last page to unlock signing.';
  if (signed) {
    hint = 'Signed on 14 November 2026. Next, pay to confirm.';
  } else if (signing) {
    hint = 'Sign above the Guest line on page 4.';
  } else if (readAll) {
    hint = 'You have read all four pages.';
  }

  const startSigning = () => {
    setSigning(true);
    viewer.goToPage(PAGES.length);
  };

  return (
    <div className={classes.page}>
      <header className={classes.header}>
        <span className={classes.logo}>haven</span>
        <span className={classes.headerStep}>Booking HV-48210</span>
      </header>

      <main className={classes.layout}>
        <section className={classes.reader}>
          <h1 className={classes.heading}>Confirm and sign</h1>
          <p className={classes.lead}>
            Marta Lindqvist asks every guest to read the house agreement before paying. It takes
            about three minutes.
          </p>

          <div className={classes.frame}>
            <DocViewer
              src="/stories/rental-agreement.pdf"
              fileName="Birch Cabin house agreement.pdf"
              store={store}
              size="sm"
              color="#e0475a"
              radius="md"
              pageBackground="white"
              onPageChange={setCurrent}
              // The guest signs with a finger or the mouse; the signature is written into the PDF
              extensions={[
                createMarkupExtension({
                  tool: signing ? 'signature' : null,
                  value: marks,
                  onChange: setMarks,
                  color: '#2a3558',
                  width: 1.6,
                  onDocumentChange: (bytes) =>
                    setToast(`Signed. Agreement saved, ${Math.round(bytes.length / 1024)} KB`),
                }),
              ]}
              pagesProps={{
                gap: 'md',
                matchColor: '#ffe3a3',
                activeMatchColor: '#ffb4bd',
                onReadingProgress: setProgress,
                renderPageOverlay: ({ pageNumber, scale }) =>
                  pageNumber === PAGES.length &&
                  !signed && (
                    <div
                      className={classes.signHere}
                      data-active={signing || undefined}
                      data-signed={signature ? true : undefined}
                      style={{
                        left: SIGN_LINE.x * scale,
                        top: (SIGN_LINE.y - 46) * scale,
                        width: SIGN_LINE.width * scale,
                        height: 46 * scale,
                      }}
                    >
                      {!signature && <span className={classes.signFlag}>Sign here</span>}
                    </div>
                  ),
              }}
              toolbarControls={{
                markup: false,
                title: false,
                thumbnails: false,
                rotate: false,
                layout: false,
                outline: false,
                info: false,
                presentation: false,
                fullscreen: false,
                wrap: false,
                viewMode: false,
                print: false,
              }}
              classNames={{
                root: classes.root,
                toolbar: classes.toolbar,
                control: classes.control,
                pageIndicator: classes.pageIndicator,
                zoomLevel: classes.zoomLevel,
                search: classes.search,
                searchInput: classes.searchInput,
                body: classes.body,
                page: classes.docPage,
              }}
            />
          </div>
        </section>

        <aside className={classes.aside}>
          <div className={classes.card}>
            <div className={classes.listing}>
              <div className={classes.photo} role="img" aria-label="A cabin by a lake at dusk">
                <span className={classes.photoSun} />
                <span className={classes.photoHills} />
                <span className={classes.photoCabin} />
                <span className={classes.photoWater} />
              </div>
              <div>
                <div className={classes.listingTitle}>Birch Cabin on Lake Wenatchee</div>
                <div className={classes.listingMeta}>Entire cabin in Leavenworth</div>
                <div className={classes.listingMeta}>4.96 (212 reviews)</div>
              </div>
            </div>

            <dl className={classes.facts}>
              <div>
                <dt>Dates</dt>
                <dd>18 to 23 Dec 2026</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>4 adults, 2 children</dd>
              </div>
            </dl>

            <dl className={classes.prices}>
              <div>
                <dt>
                  {money(RATE)} x {NIGHTS} nights
                </dt>
                <dd>{money(NIGHTS * RATE)}</dd>
              </div>
              <div>
                <dt>Cleaning fee</dt>
                <dd>{money(CLEANING)}</dd>
              </div>
              <div>
                <dt>Haven service fee</dt>
                <dd>{money(SERVICE)}</dd>
              </div>
              <div className={classes.totalRow}>
                <dt>Total (USD)</dt>
                <dd>{money(total)}</dd>
              </div>
            </dl>

            <div className={classes.divider} />

            <div className={classes.progressHead}>
              <span className={classes.progressTitle}>Agreement</span>
              <span className={classes.progressCount} data-done={readAll || undefined}>
                {pagesRead} of {PAGES.length} pages read
              </span>
            </div>
            <ol className={classes.meter}>
              {PAGES.map((title, index) => {
                const page = index + 1;
                const read = fractions[index] >= READ;
                return (
                  <li key={title}>
                    <button
                      type="button"
                      className={classes.segment}
                      data-seen={read || undefined}
                      data-current={current === page || undefined}
                      style={
                        { '--seen': Math.min(fractions[index] / READ, 1) } as React.CSSProperties
                      }
                      aria-label={`Go to page ${page}, ${title}${read ? ', read' : ''}`}
                      onClick={() => viewer.goToPage(page)}
                    >
                      <span className={classes.segmentBar} />
                      <span className={classes.segmentLabel}>{title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className={classes.hint} data-done={readAll || undefined}>
              {hint}
            </p>

            <fieldset
              className={classes.sign}
              disabled={!readAll || signed}
              data-locked={!readAll || undefined}
            >
              <TextInput
                label="Type your full name to sign"
                placeholder="Daniel Okafor"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                autoComplete="off"
                maxLength={40}
                classNames={{ label: classes.inputLabel, input: classes.input }}
              />
              {signature ? (
                <div className={classes.signed}>
                  <span className={classes.signedText}>Signed on page 4</span>
                  {!signed && (
                    <UnstyledButton
                      className={classes.signAgain}
                      onClick={() => {
                        setMarks([]);
                        startSigning();
                      }}
                    >
                      Sign again
                    </UnstyledButton>
                  )}
                </div>
              ) : (
                <Button
                  variant="default"
                  fullWidth
                  className={classes.signButton}
                  onClick={startSigning}
                  disabled={signing}
                >
                  {signing ? 'Signing on page 4' : 'Sign on the agreement'}
                </Button>
              )}
              <Checkbox
                label="I have read the house agreement and agree to follow it"
                checked={agreed}
                onChange={(event) => setAgreed(event.currentTarget.checked)}
                color="#e0475a"
                classNames={{ label: classes.checkLabel, input: classes.checkInput }}
              />
            </fieldset>

            {signed ? (
              <Button
                fullWidth
                className={classes.continue}
                data-signed
                onClick={() => setToast('Opening payment')}
              >
                Pay {money(total)}
              </Button>
            ) : (
              <Button
                fullWidth
                className={classes.continue}
                disabled={!canSign}
                onClick={async () => {
                  setSigning(false);
                  setSigned(true);
                  // Writes the drawn signature into the agreement and hands the PDF to onSave
                  await saveMarkup(store);
                }}
              >
                Sign and continue
              </Button>
            )}
            <p className={classes.fine}>You will not be charged until you pay on the next step.</p>
          </div>
        </aside>
      </main>

      {toast && (
        <div className={classes.toast} role="status">
          <span className={classes.toastDot} aria-hidden />
          {toast}
        </div>
      )}
    </div>
  );
}
