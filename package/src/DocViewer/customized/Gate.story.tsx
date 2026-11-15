import {
  createTheme,
  MantineProvider,
  SegmentedControl,
  type MantineColorsTuple,
} from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
import classes from './Gate.module.css';

export default { title: 'DocViewer/Apps/Gate (airline app)' };

// Seabright navy, so anything Mantine draws for the viewer (focus rings, pressed states) is on brand
const navy: MantineColorsTuple = [
  '#eef4fa',
  '#d6e3f1',
  '#adc6e3',
  '#7fa5d2',
  '#5589c3',
  '#3a76ba',
  '#2c68ad',
  '#1f5a9d',
  '#13315c',
  '#0b2545',
];

const gateTheme = createTheme({
  primaryColor: 'seabright',
  primaryShade: 9,
  colors: { seabright: navy },
  fontFamily: 'Manrope, system-ui, sans-serif',
  defaultRadius: 12,
});

const PASS = 'pass';
const RECEIPT = 'receipt';

// What the strip under the viewer says for each page of the e-ticket
const HINTS = [
  'Brightness is at maximum for the gate reader',
  'Keep this receipt for your expense report',
  'Bag drop for SB 482 closes at 08:40',
];

function StatusBar() {
  return (
    <div className={classes.statusBar} aria-hidden>
      <span>8:47</span>
      <span className={classes.statusIcons}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.8" />
          <rect x="4.6" y="4.7" width="3" height="6.3" rx="0.8" />
          <rect x="9.2" y="2.3" width="3" height="8.7" rx="0.8" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.8" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="11"
            rx="3.2"
            stroke="currentColor"
            opacity="0.4"
          />
          <rect x="2" y="2" width="14" height="8" rx="2" fill="currentColor" />
          <rect x="22.6" y="4" width="1.8" height="4" rx="0.9" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="11" fill="#F4B400" />
      <path d="M4.4 15.2L11 6.8l6.6 8.4H15L11 10.1l-4 5.1z" fill="#0B2545" />
    </svg>
  );
}

function Plane() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"
        transform="rotate(90 12 12)"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A traveller opens their e-ticket at the gate. The pass has to be big and scannable, and one
 * tap away is the receipt for the expense report.
 */
export function Gate() {
  const controllerRef = useRef<DocViewerController>(null);
  const [page, setPage] = useState(1);
  const view = page === 1 ? PASS : RECEIPT;

  return (
    <MantineProvider theme={gateTheme} forceColorScheme="light">
      <div className={classes.stage}>
        <div className={classes.phone}>
          <div className={classes.screen}>
            <header className={classes.header}>
              <StatusBar />
              <div className={classes.brandRow}>
                <span className={classes.brand}>
                  <Mark />
                  Seabright Air
                </span>
                <span className={classes.flightNo}>SB 482, Tue 18 Nov</span>
              </div>

              <div className={classes.route}>
                <div className={classes.leg}>
                  <span className={classes.time}>09:40</span>
                  <span className={classes.airport}>
                    <strong>LIS</strong> Lisbon
                  </span>
                </div>
                <div className={classes.flightPath} aria-label="3 hours 25 minutes, direct">
                  <span className={classes.pathLine} />
                  <Plane />
                  <span className={classes.pathLine} />
                </div>
                <div className={classes.leg} data-end>
                  <span className={classes.time}>14:05</span>
                  <span className={classes.airport}>
                    <strong>CPH</strong> Copenhagen
                  </span>
                </div>
              </div>

              <dl className={classes.facts}>
                <div className={classes.fact} data-changed>
                  <dt>Gate</dt>
                  <dd>B34</dd>
                  <span className={classes.was}>was B27</span>
                </div>
                <div className={classes.fact}>
                  <dt>Boards</dt>
                  <dd>09:05</dd>
                </div>
                <div className={classes.fact}>
                  <dt>Group</dt>
                  <dd>3</dd>
                </div>
                <div className={classes.fact}>
                  <dt>Seat</dt>
                  <dd>14A</dd>
                </div>
              </dl>
            </header>

            <div className={classes.switchRow}>
              <SegmentedControl
                fullWidth
                value={view}
                onChange={(value) => controllerRef.current?.goToPage(value === PASS ? 1 : 2)}
                data={[
                  { value: PASS, label: 'Boarding pass' },
                  { value: RECEIPT, label: 'Receipt' },
                ]}
                aria-label="Show the boarding pass or the receipt"
                classNames={{
                  root: classes.segments,
                  indicator: classes.segmentsIndicator,
                  label: classes.segmentsLabel,
                }}
              />
            </div>

            <DocViewer
              src="/stories/boarding-pass.pdf"
              fileName="SB 482 boarding pass.pdf"
              pdfWorkerSrc={pdfWorkerSrc}
              controllerRef={controllerRef}
              onPageChange={setPage}
              // Phone first: big touch targets, tighter on the wider screens that show this mock-up
              size={{ base: 'md', sm: 'xs' }}
              pageGap={{ base: 'sm', sm: 'xs' }}
              thumbnailWidth={{ base: 64, sm: 56 }}
              radius={0}
              color="#0B2545"
              defaultThumbnailsOpened
              defaultThumbnailsPosition="bottom"
              withPrint={false}
              withFullscreen={false}
              // Only what fits a phone at the gate
              toolbarControls={{
                title: false,
                thumbnails: false,
                zoom: false,
                rotate: false,
                layout: false,
                outline: false,
                info: false,
                presentation: false,
                search: false,
              }}
              tooltipProps={{ disabled: true }}
              classNames={{
                root: classes.root,
                toolbar: classes.toolbar,
                controls: classes.controls,
                control: classes.control,
                pageIndicator: classes.pageIndicator,
                body: classes.body,
                pages: classes.pages,
                page: classes.pageSheet,
                thumbnails: classes.thumbnails,
                thumbnail: classes.thumbnail,
                thumbnailImage: classes.thumbnailImage,
                thumbnailLabel: classes.thumbnailLabel,
              }}
              // A tap on the pass hides the toolbar so the barcode fills the phone, another brings it back
              tapToggleToolbar
              // MISSING: `thumbnailsPosition` as a responsive value (left on desktop, bottom on phones).
              // MISSING: a way to keep the screen awake and at full brightness while the pass is shown; that is the host app's job.
            />

            <footer className={classes.footer}>
              <p className={classes.hint}>
                {page === 1 && <SunIcon />}
                {HINTS[Math.min(page, HINTS.length) - 1]}
              </p>
              <span className={classes.homeIndicator} aria-hidden />
            </footer>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}
