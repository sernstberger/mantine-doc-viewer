import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useMemo } from 'react';
import { useLinkService } from './use-link-service';
import type { PdfPagesContextValue } from './use-pages-config';
import { usePassageHighlight } from './use-passage-highlight';
import { usePdfLayers } from './use-pdf-layers';
import { usePdfSearchBar } from './use-pdf-search-bar';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfViewGeometry } from './use-pdf-view-geometry';
import { useSearchHighlights, useTextLayers } from './use-search-highlights';
import { useTextSelect } from './use-text-select';

/** What the pages show over the drawing: search matches, a passage, selected text, layers and links */
export function usePdfPageContent(
  context: PdfPagesContextValue,
  document: PDFDocumentProxy | null,
  { scrollRoot, viewport, scale, rotation }: PdfViewGeometry,
  { currentPage, scrollToPage }: PdfReadingPosition
) {
  const { events } = context;
  const search = usePdfSearchBar(context.store, document, scrollRoot);
  const textLayers = useTextLayers();
  useSearchHighlights({
    textLayers,
    pages: search.pages,
    matches: search.matches,
    activeMatch: search.activeMatch,
    scrollRoot,
    viewport,
    scrollToPage,
  });
  const passage = usePassageHighlight({
    document,
    textLayers,
    scrollRoot,
    viewport,
    scrollToPage,
    scale,
    rotation,
  });
  useTextSelect({ scrollRoot, scale, rotation, onTextSelect: events.onTextSelect });
  const pdfLayers = usePdfLayers(document);
  // One object per layer change, so pages only draw again (and render) when a layer is toggled
  const layers = useMemo(
    () => ({ config: pdfLayers.config, version: pdfLayers.version }),
    [pdfLayers.config, pdfLayers.version]
  );
  const linkService = useLinkService({ document, currentPage, scale, scrollToPage, events });

  return { search, textLayers, passage, pdfLayers, layers, linkService };
}

export type PdfPageContent = ReturnType<typeof usePdfPageContent>;
