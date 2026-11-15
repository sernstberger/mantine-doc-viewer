import { Anchor, Avatar, Button } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useMemo, useRef, useState } from 'react';
import type { DocViewerController } from '../controller';
import { DocViewer } from '../DocViewer';
import classes from './FieldReport.module.css';

export default {
  title: 'DocViewer/Apps/Field Report (embedded article)',
  parameters: { layout: 'fullscreen' },
};

const REPORT_URL = '/stories/field-report.pdf';
const REPORT_PAGES = 6;

const JUMPS = [
  { label: 'Summary', page: 2 },
  { label: 'Chart', page: 3 },
  { label: 'Data', page: 4 },
  { label: 'Recommendations', page: 5 },
];

/** Deterministic scatter of the 41 tracts: canopy against afternoon surface temperature */
function buildScatter() {
  const named = [
    { name: 'Highland Park', canopy: 41, delta: -4.1 },
    { name: 'Millbrook', canopy: 27, delta: -0.8 },
    { name: 'Canal Yards', canopy: 7, delta: 6.3 },
  ];
  const width = 1200;
  const height = 600;
  const left = 96;
  const right = 40;
  const top = 36;
  const bottom = 92;
  const x = (canopy: number) => left + (canopy / 50) * (width - left - right);
  const y = (delta: number) => top + ((10 - delta) / 16) * (height - top - bottom);

  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const points = Array.from({ length: 38 }, () => {
    const canopy = 4 + random() * 40;
    return { canopy, delta: 8.44 - 0.306 * canopy + (random() - 0.5) * 3.6 };
  });

  const grid = [-4, 0, 4, 8]
    .map(
      (value) =>
        `<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" stroke="${value === 0 ? '#0f1b2d' : '#d7dee6'}" stroke-width="${value === 0 ? 2 : 1.5}"/>` +
        `<text x="${left - 16}" y="${y(value) + 7}" text-anchor="end" font-size="22" fill="#5a6678">${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}</text>`
    )
    .join('');
  const ticks = [0, 10, 20, 30, 40, 50]
    .map(
      (value) =>
        `<text x="${x(value)}" y="${height - bottom + 36}" text-anchor="middle" font-size="22" fill="#5a6678">${value}%</text>`
    )
    .join('');
  const dots = points
    .map(
      (point) =>
        `<circle cx="${x(point.canopy)}" cy="${y(point.delta)}" r="9" fill="${point.delta < 0 ? '#0e5e6f' : '#d1603d'}" fill-opacity="0.55"/>`
    )
    .join('');
  const labelled = named
    .map((point) => {
      const cx = x(point.canopy);
      const cy = y(point.delta);
      const anchor = point.canopy > 20 ? 'end' : 'start';
      const dx = anchor === 'end' ? -18 : 18;
      const dy = anchor === 'end' ? 34 : -14;
      return (
        `<circle cx="${cx}" cy="${cy}" r="12" fill="${point.delta < 0 ? '#0e5e6f' : '#d1603d'}" stroke="#fff" stroke-width="3"/>` +
        `<text x="${cx + dx}" y="${cy + dy}" text-anchor="${anchor}" font-size="24" font-weight="600" fill="#0f1b2d">${point.name}</text>`
      );
    })
    .join('');

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'IBM Plex Sans', Helvetica, Arial, sans-serif">`,
    `<rect width="${width}" height="${height}" fill="#fff"/>`,
    grid,
    `<line x1="${x(0)}" y1="${y(8.44)}" x2="${x(46)}" y2="${y(8.44 - 0.306 * 46)}" stroke="#0f1b2d" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round"/>`,
    dots,
    labelled,
    ticks,
    `<text x="${(left + width - right) / 2}" y="${height - 18}" text-anchor="middle" font-size="23" fill="#0f1b2d">Tree canopy, share of land</text>`,
    `<text x="${left}" y="22" font-size="23" fill="#0f1b2d">Afternoon surface temperature vs city average, °F</text>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * An online research publication runs a long-form article with two figures: a chart as an image and
 * the full policy report as a PDF, set into the text with no app chrome around it.
 */
export function FieldReport() {
  const controllerRef = useRef<DocViewerController>(null);
  const [page, setPage] = useState(1);
  const [position, setPosition] = useState(0);
  const scatter = useMemo(buildScatter, []);

  return (
    <div className={classes.site}>
      <header className={classes.masthead}>
        <span className={classes.wordmark}>Meridian</span>
        <nav className={classes.nav} aria-label="Sections">
          <a href="#environment">Environment</a>
          <a href="#cities">Cities</a>
          <a href="#health">Health</a>
          <a href="#data">Data</a>
        </nav>
      </header>

      <article className={classes.article}>
        <header className={classes.header}>
          <p className={classes.section}>Cities and climate</p>
          <h1 className={classes.headline}>
            The hottest street in Calder is the one with no trees
          </h1>
          <p className={classes.dek}>
            Over seven afternoons this summer, volunteers and a plane measured the temperature of
            every block in the city. The gap between the shadiest neighbourhood and the barest was
            more than ten degrees, and it tracks the emergency room almost perfectly.
          </p>
          <div className={classes.byline}>
            <Avatar color="teal" radius="xl" size={44}>
              PR
            </Avatar>
            <div>
              <div className={classes.author}>
                By <strong>Priya Raman</strong>, staff writer
              </div>
              <div className={classes.dateline}>
                <time dateTime="2026-10-14">14 October 2026</time>, 9 minute read
              </div>
            </div>
          </div>
        </header>

        <div className={classes.prose}>
          <p className={classes.lead}>
            On the afternoon of 14 August, a sensor zip-tied to a bus shelter on Canal Street read
            117 degrees at the pavement. Four blocks north, in the shade of the oaks in Highland
            Park, an identical sensor read 98.
          </p>
          <p>
            Nobody in Calder was surprised that a bus shelter was hot. What surprised the city
            researchers who ran the numbers this autumn was how neatly the whole city sorted itself.
            Line up the 41 census tracts by the share of land under tree canopy and the temperature
            falls in an almost straight line from one end to the other.
          </p>
          <p>
            The study, from the Calder Urban Policy Lab, is the first to cover the whole city rather
            than a few instrumented parks. It combines thermal images from the regional air survey
            with readings from 212 street-level sensors, installed and checked by volunteers from
            the Calder Heat Watch.
            <sup>
              <a href="#note-1" id="ref-1" className={classes.noteRef}>
                1
              </a>
            </sup>
          </p>
        </div>

        <figure className={classes.wide}>
          <div className={classes.figureHead}>
            <span className={classes.figureLabel}>Figure 1</span>
            <span className={classes.figureTitle}>More trees, cooler afternoons</span>
          </div>
          <div className={classes.plate}>
            <DocViewer
              src={scatter}
              mimeType="image/svg+xml"
              fileName="Tree canopy and surface temperature, Calder, summer 2026.svg"
              withToolbar={false}
              variant="plain"
              // An image has no pages to grow to, so the figure is as tall as the plot is wide
              h={496}
              // Readers can still zoom the plot or open it full screen, without a toolbar
              withOverlayControls
              classNames={{
                root: classes.root,
                body: classes.imageBody,
                overlayControl: classes.figureControl,
              }}
            />
          </div>
          <figcaption className={classes.caption}>
            Each dot is one census tract. Tracts with more canopy ran cooler: about three degrees
            for every ten points of land under trees. Source: Calder Urban Policy Lab, thermal
            passes 21 June to 30 August 2026.
          </figcaption>
        </figure>

        <div className={classes.prose}>
          <h2>The difference shows up in the hospital</h2>
          <p>
            Heat is not an abstraction at the bottom of the chart. In Canal Yards, which has 7
            percent canopy, doctors coded 39 heat-related emergency visits for every 10,000
            residents this summer. In Highland Park, with 41 percent, the figure was 6.
          </p>
          <blockquote className={classes.pull}>
            <p>
              A tree is the only piece of public infrastructure that{' '}
              <mark>gets better the longer you leave it alone</mark>.
            </p>
            <cite>Dr. Imani Okafor, lead author</cite>
          </blockquote>
          <p>
            Okafor is careful about what the study can and cannot say. Canopy is not handed out at
            random, and the neighbourhoods with the least of it are also the ones with the lowest
            incomes, the oldest housing and the fewest air conditioners. But the team tested for
            building density, paving and income, and canopy still did the most work.
          </p>
          <p>
            The full report is below. The summary on page two is a good place to start; the chart
            and the table behind it are on pages three and four.
          </p>
        </div>

        <figure className={classes.embed}>
          <div className={classes.figureHead}>
            <span className={classes.figureLabel}>Figure 2</span>
            <span className={classes.figureTitle}>Shade and the summer street, full report</span>
          </div>
          <div className={classes.captionBar}>
            <div className={classes.captionStatus} aria-live="polite">
              Page {page} of {REPORT_PAGES}, {Math.round(position * 100)}% read
            </div>
            <div
              className={classes.captionRule}
              role="progressbar"
              aria-label="Reading position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position * 100)}
            >
              <span style={{ transform: `scaleX(${position})` }} />
            </div>
            <div className={classes.jumps}>
              {JUMPS.map((jump) => (
                <button
                  key={jump.page}
                  type="button"
                  className={classes.jump}
                  data-active={page === jump.page || undefined}
                  onClick={() => controllerRef.current?.goToPage(jump.page)}
                >
                  {jump.label}
                </button>
              ))}
            </div>
            <Button
              component="a"
              href={REPORT_URL}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              color="teal"
              size="compact-sm"
              className={classes.openLink}
            >
              Open full report
            </Button>
          </div>
          <div className={classes.plate}>
            <div className={classes.well}>
              <DocViewer
                src={REPORT_URL}
                fileName="Shade and the summer street.pdf"
                pdfWorkerSrc={pdfWorkerSrc}
                controllerRef={controllerRef}
                onPageChange={setPage}
                onReadingProgress={(progress) => setPosition(progress.position)}
                withToolbar={false}
                variant="plain"
                radius={0}
                size="sm"
                color="teal"
                pageGap="lg"
                pageBackground="white"
                defaultZoom="fit"
                // As tall as the report: the article scrolls, not a window inside it
                height="auto"
                classNames={{
                  root: classes.root,
                  body: classes.reportBody,
                  page: classes.reportPage,
                }}
              />
            </div>
          </div>
          <figcaption className={classes.caption}>
            Calder Urban Policy Lab, policy report 2026-04. Six pages, with the data table in the
            middle. Scroll the pages here, or follow the link in note 1 to read it on its own.
          </figcaption>
        </figure>

        <div className={classes.prose}>
          <h2>What the city could do on Monday</h2>
          <p>
            The report makes four recommendations, and the cheapest is also the one the team thinks
            matters most: let tenants ask for a tree. Today only the owner of the adjoining property
            can request one, and in the five hottest neighbourhoods most residents rent.
          </p>
          <p>
            The council has asked the parks department to respond by January. A spokesperson said
            the department supported planting to a heat map but had not costed the proposal to pay
            for shade from the stormwater fund.
            <sup>
              <a href="#note-2" id="ref-2" className={classes.noteRef}>
                2
              </a>
            </sup>
          </p>
          <p>
            On Canal Street the bus shelter is still there. A resident who has waited at it for
            eleven years, and asked not to be named because she rents the flat above the laundrette
            on the corner, said she had stopped looking at the thermometer in the window. It is the
            wrong number, she said. The right number is how long you can stand to wait.
          </p>
        </div>

        <aside className={classes.notes} aria-labelledby="notes-title">
          <h2 id="notes-title" className={classes.notesTitle}>
            Notes
          </h2>
          <ol>
            <li id="note-1">
              Calder Heat Watch sensors were calibrated against the airport weather station before
              and after the season; readings that drifted by more than a degree were dropped. See
              page six of the{' '}
              <Anchor href={REPORT_URL} target="_blank" rel="noreferrer" c="teal.8">
                report
              </Anchor>
              . <a href="#ref-1">Back to the text</a>
            </li>
            <li id="note-2">
              Statement to Meridian, 9 October 2026. The parks department said a costed proposal
              would take until spring. <a href="#ref-2">Back to the text</a>
            </li>
          </ol>
        </aside>
      </article>
    </div>
  );
}
