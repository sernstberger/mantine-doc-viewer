import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect, useState } from 'react';
import type { DocViewerOutlineItem } from '../controller';
import { useDocViewerContext } from '../DocViewer.context';
import { resolveDestination } from './link-service';

type OutlineNode = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number];

/** Loads the document outline (bookmarks), `null` while loading and an empty list when there is none */
export function usePdfOutline(document: PDFDocumentProxy | null) {
  const [outline, setOutline] = useState<OutlineNode[] | null>(null);

  useEffect(() => {
    if (!document) {
      return undefined;
    }

    let cancelled = false;
    setOutline(null);
    document.getOutline().then(
      (items) => !cancelled && setOutline(items ?? []),
      () => !cancelled && setOutline([])
    );
    return () => {
      cancelled = true;
    };
  }, [document]);

  return outline;
}

/** Page number, counted from 1, that an outline destination points to */
export async function resolveDestinationPage(
  document: PDFDocumentProxy,
  dest: OutlineNode['dest']
): Promise<number | null> {
  return (await resolveDestination(document, dest))?.page ?? null;
}

/** The outline with page numbers resolved, for apps that show it themselves */
export async function getResolvedOutline(
  document: PDFDocumentProxy,
  items: OutlineNode[] | null
): Promise<DocViewerOutlineItem[]> {
  return Promise.all(
    (items ?? []).map(async (item) => ({
      title: item.title,
      url: item.url ?? null,
      page: item.url ? null : await resolveDestinationPage(document, item.dest).catch(() => null),
      items: await getResolvedOutline(document, item.items),
    }))
  );
}

interface PdfOutlineProps {
  document: PDFDocumentProxy;
  items: OutlineNode[];
  onSelect: (page: number) => void;
}

function OutlineList({ document, items, onSelect }: PdfOutlineProps) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <ul {...getStyles('outlineList')}>
      {items.map((item, index) => (
        <li key={index}>
          {item.url ? (
            <a
              {...getStyles('outlineItem')}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
              <VisuallyHidden> {labels.opensInNewTab}</VisuallyHidden>
            </a>
          ) : (
            <UnstyledButton
              {...getStyles('outlineItem')}
              fw={item.bold ? 600 : undefined}
              fs={item.italic ? 'italic' : undefined}
              onClick={async () => {
                const page = await resolveDestinationPage(document, item.dest).catch(() => null);
                page && onSelect(page);
              }}
            >
              {item.title}
            </UnstyledButton>
          )}
          {item.items.length > 0 && (
            <OutlineList document={document} items={item.items} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Table of contents of a PDF, from its bookmarks */
export function PdfOutline(props: PdfOutlineProps) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <nav {...getStyles('outline')} aria-label={labels.outline}>
      <OutlineList {...props} />
    </nav>
  );
}
