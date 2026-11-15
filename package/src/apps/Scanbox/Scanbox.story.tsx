import {
  Button,
  createTheme,
  MantineProvider,
  useMatches,
  type MantineColorsTuple,
  type MantineSize,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { createPageEditorExtension, DocViewerPageEditorButton } from '../../editor';
import { DocViewer, useDocViewer } from '../../index';
import classes from './Scanbox.module.css';

function saveBytes(bytes: Uint8Array, fileName: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
}

export default {
  title: 'Apps/Scanbox',
  parameters: { layout: 'fullscreen' },
};

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

function ScanboxScreen() {
  const [store, viewer] = useDocViewer();
  const size = useMatches<MantineSize>({ base: 'md', sm: 'sm' });
  const gap = useMatches<MantineSize>({ base: 'lg', sm: 'md' });
  const thumbnailWidth = useMatches({ base: 96, sm: 88 });
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
    <>
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

            <DocViewer.Root
              src="/stories/receipts.pdf"
              fileName={fileName}
              store={store}
              // Phone first: big touch targets, a tighter toolbar on wider screens
              size={size}
              radius={0}
              color="#00A38C"
              defaultThumbnailsOpened
              defaultThumbnailsPosition="bottom"
              // A camera roll: swipe sideways through the receipts, each one fitted to the height
              defaultPageLayout="horizontal"
              defaultZoom="fit"
              extensions={[
                createPageEditorExtension({
                  // A phone has no room for words on the editor's buttons
                  compact: true,
                  onDocumentChange: (bytes, { reason, pages: saved }) => {
                    setPages(saved.length);
                    setToast(
                      reason === 'delete'
                        ? 'Page deleted'
                        : `Saved ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}, ${formatSize(bytes.length)}`
                    );
                  },
                  onExtract: (_bytes, { pages: saved }) => {
                    setPages(saved.length);
                    setToast(`Extracted ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}`);
                  },
                  labels: {
                    moveEarlierLabel: 'Earlier',
                    moveLaterLabel: 'Later',
                    deletePagesLabel: 'Delete',
                    extractPagesLabel: 'Extract',
                    savePagesLabel: 'Save',
                  },
                }),
              ]}
              onDocumentLoad={(info) => setPages(info.numPages ?? 5)}
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
                editorButton: classes.editorButton,
                thumbnailDelete: classes.thumbnailDelete,
                editorPages: classes.editorPages,
                editorPage: classes.editorPage,
              }}
              // MISSING: crop and perspective-correct a page, and filters (black and white, enhance).
            >
              <DocViewer.Toolbar tooltipProps={{ disabled: true }}>
                <DocViewer.PageControls />
                <DocViewer.RotateButton />
                <DocViewerPageEditorButton />
              </DocViewer.Toolbar>
              <DocViewer.Main>
                <DocViewer.Thumbnails width={thumbnailWidth} />
                <DocViewer.Pages gap={gap} />
              </DocViewer.Main>
            </DocViewer.Root>

            <div className={classes.exportBar}>
              <Button
                className={classes.exportButton}
                size="lg"
                fullWidth
                onClick={async () => {
                  // The bytes as shown, after any deleted, moved or extracted pages
                  const bytes = await viewer.getBytes();
                  if (bytes) {
                    saveBytes(bytes, fileName);
                    setToast(`Exported ${formatSize(bytes.length)}`);
                  }
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
      </div>
    </>
  );
}

/**
 * A freelancer scanned five receipts on the train and needs one expense PDF: check the pages,
 * reorder or drop the ones that do not belong, then export.
 */
export function Scanbox() {
  return (
    <MantineProvider theme={scanboxTheme} forceColorScheme="light">
      <ScanboxScreen />
    </MantineProvider>
  );
}

Scanbox.storyName = 'Scanbox';
Scanbox.parameters = {
  docs: {
    description: {
      story:
        'A freelancer scanned five receipts on the train and needs one expense PDF: check the pages, reorder or drop the ones that do not belong, then export.',
    },
  },
};
