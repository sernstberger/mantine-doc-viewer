import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useState } from 'react';
import { DocViewer } from '../DocViewer';
import classes from './Folio.module.css';

export default { title: 'DocViewer/Apps/Folio (desktop document app)' };

interface Toast {
  title: string;
  text: string;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * A Mac user tidies a quarterly report before sending it: remove the draft cover, reorder
 * sections and extract pages from the page editor, then mark it up and sign it off.
 */
export function Folio() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <div className={classes.desktop}>
      <div className={classes.window}>
        <div className={classes.trafficLights} aria-hidden>
          <span className={classes.light} />
          <span className={classes.light} />
          <span className={classes.light} />
        </div>

        <DocViewer
          src="/stories/quarterly-report.pdf"
          fileName="Q3 2026 quarterly report.pdf"
          pdfWorkerSrc={pdfWorkerSrc}
          size="xs"
          color="blue"
          thumbnailWidth={92}
          pageGap="lg"
          // Opens at actual size, like a desktop reader, so whole pages are visible
          defaultZoom={1}
          defaultThumbnailsOpened
          withPageEditing
          // Markup writes real PDF annotations, so the report opens marked up in any reader
          withMarkup
          markupTools={['highlight', 'text', 'rectangle', 'ellipse', 'signature']}
          // A native app writes back to the file; here the bytes only feed the notification
          onSave={(bytes, { reason, pages }) => {
            setEdited(true);
            setToast(
              reason === 'extract'
                ? {
                    title: `Extracted ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`,
                    text: `New document, ${formatSize(bytes.length)}`,
                  }
                : reason === 'delete'
                  ? { title: 'Page deleted', text: `${pages.length} pages left` }
                  : reason === 'annotate'
                    ? {
                        title: 'Markup saved',
                        text: `Marks on ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}, ${formatSize(bytes.length)}`,
                      }
                    : {
                        title: 'Saved',
                        text: `${pages.length} pages, ${formatSize(bytes.length)}`,
                      }
            );
          }}
          // Like a macOS title bar: the name with a small line under it
          toolbarSubtitle={edited ? 'Edited' : 'On this Mac'}
          // A document app opens files in place, there is nothing to download
          withDownload={false}
          tooltipProps={{ openDelay: 500, position: 'bottom' }}
          classNames={{
            root: classes.root,
            toolbar: classes.toolbar,
            title: classes.title,
            subtitle: classes.subtitle,
            control: classes.control,
            pageIndicator: classes.pageIndicator,
            zoomLevel: classes.zoomLevel,
            search: classes.search,
            body: classes.body,
            page: classes.page,
            thumbnails: classes.thumbnails,
            thumbnail: classes.thumbnail,
            thumbnailImage: classes.thumbnailImage,
            thumbnailLabel: classes.thumbnailLabel,
            editorBar: classes.editorBar,
            thumbnailDelete: classes.thumbnailDelete,
            markupBar: classes.markupBar,
            editorPages: classes.editorPages,
            editorPage: classes.editorPage,
          }}
          // MISSING: rotating one page and saving it; rotate only turns the view of every page.
        />

        {toast && (
          <div className={classes.toast} role="status">
            <div className={classes.toastIcon} aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className={classes.toastTitle}>{toast.title}</div>
              <div className={classes.toastText}>{toast.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
