import { Button, createTheme, MantineProvider, type MantineColorsTuple } from '@mantine/core';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import { DocViewer } from '../DocViewer';
import type { DocViewerController } from '../controller';
import classes from './Scanbox.module.css';

export default { title: 'DocViewer/Apps/Scanbox (phone scanner)' };

// Scanbox teal, so the page editor's own buttons (Save, Done) match the app
const teal: MantineColorsTuple = [
  '#e3f5f1',
  '#c4ebe3',
  '#9fdfd2',
  '#6fd0bf',
  '#3fbfa9',
  '#12b098',
  '#00a38c',
  '#008c78',
  '#007565',
  '#005e51',
];

const scanboxTheme = createTheme({
  primaryColor: 'scanbox',
  primaryShade: 6,
  colors: { scanbox: teal },
  fontFamily: 'Manrope, system-ui, sans-serif',
  defaultRadius: 12,
});

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBar() {
  return (
    <div className={classes.statusBar} aria-hidden>
      <span>9:41</span>
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
          <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
          <rect x="22.6" y="4" width="1.8" height="4" rx="0.9" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

/**
 * A freelancer scanned five receipts on the train and needs one expense PDF: check the pages,
 * reorder or drop the ones that do not belong, then export.
 */
export function Scanbox() {
  const controllerRef = useRef<DocViewerController>(null);
  const [name, setName] = useState('March expenses');
  const [pages, setPages] = useState(5);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const fileName = `${name.trim() || 'Scan'}.pdf`;

  return (
    <MantineProvider theme={scanboxTheme} forceColorScheme="light">
      <div className={classes.stage}>
        <div className={classes.phone}>
          <div className={classes.screen}>
            <StatusBar />

            <header className={classes.topBar}>
              <button type="button" className={classes.back} aria-label="Back to scans">
                <BackIcon />
              </button>
              <div className={classes.nameField}>
                <input
                  className={classes.nameInput}
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                  aria-label="Document name"
                  spellCheck={false}
                  maxLength={48}
                />
                <span className={classes.count}>
                  {pages} {pages === 1 ? 'page' : 'pages'}
                </span>
              </div>
            </header>

            <DocViewer
              src="/stories/receipts.pdf"
              fileName={fileName}
              pdfWorkerSrc={pdfWorkerSrc}
              controllerRef={controllerRef}
              // Phone first: big touch targets, a tighter toolbar on wider screens
              size={{ base: 'md', sm: 'sm' }}
              pageGap={{ base: 'lg', sm: 'md' }}
              thumbnailWidth={{ base: 96, sm: 88 }}
              radius={0}
              color="#00A38C"
              defaultThumbnailsOpened
              defaultThumbnailsPosition="bottom"
              // A camera roll: swipe sideways through the receipts, each one fitted to the height
              defaultPageLayout="horizontal"
              defaultZoom="fit"
              withPageEditing
              withPrint={false}
              withDownload={false}
              withFullscreen={false}
              toolbarControls={{
                title: false,
                thumbnails: false,
                zoom: false,
                layout: false,
                outline: false,
                info: false,
                presentation: false,
                search: false,
              }}
              onDocumentLoad={(info) => setPages(info.numPages ?? 5)}
              onSave={(bytes, { reason, pages: saved }) => {
                setPages(saved.length);
                setToast(
                  reason === 'extract'
                    ? `Extracted ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}`
                    : `Saved ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}, ${formatSize(bytes.length)}`
                );
              }}
              labels={{
                moveEarlier: 'Earlier',
                moveLater: 'Later',
                deletePages: 'Delete',
                extractPages: 'Extract',
                savePages: 'Save',
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
                page: classes.page,
                thumbnails: classes.thumbnails,
                thumbnail: classes.thumbnail,
                thumbnailImage: classes.thumbnailImage,
                thumbnailLabel: classes.thumbnailLabel,
                editorBar: classes.editorBar,
                editorPages: classes.editorPages,
                editorPage: classes.editorPage,
              }}
              // MISSING: delete a page from the thumbnail strip with a swipe or a trash button; deleting needs the page editor.
              // MISSING: crop and perspective-correct a page, and filters (black and white, enhance).
              // MISSING: a compact, icon-only variant of the page editor's action buttons; they are Mantine Buttons without a Styles API part.
            />

            <div className={classes.exportBar}>
              <Button
                className={classes.exportButton}
                size="lg"
                fullWidth
                onClick={() => {
                  controllerRef.current?.download();
                  setToast('Exported');
                }}
              >
                Export PDF
              </Button>
              <span className={classes.homeIndicator} aria-hidden />
            </div>

            {toast && (
              <div className={classes.toast} role="status">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3.5 8.5l3 3 6-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {toast}
              </div>
            )}
          </div>
        </div>
        {/* MISSING: onSave is only called by the page editor, so Export PDF downloads the document as it is displayed and cannot hand the bytes to the app. */}
      </div>
    </MantineProvider>
  );
}
