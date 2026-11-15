import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocViewerContextValue } from '../DocViewer.context';
import { useLinkService } from './use-link-service';
import { useMarkup } from './use-markup';
import { usePassageHighlight } from './use-passage-highlight';
import { usePdfLayers } from './use-pdf-layers';
import { usePdfSearchBar } from './use-pdf-search-bar';
import type { PdfReadingPosition } from './use-pdf-reading-position';
import type { PdfViewGeometry } from './use-pdf-view-geometry';
import { useSearchHighlights, useTextLayers } from './use-search-highlights';
import { useTextSelect } from './use-text-select';

/** What the pages show over the drawing: search matches, a passage, selected text, markup, layers and links */
export function usePdfPageContent(
  context: DocViewerContextValue,
  document: PDFDocumentProxy | null,
  { scrollRoot, viewport, scale, rotation }: PdfViewGeometry,
  { currentPage, scrollToPage, announce }: PdfReadingPosition
) {
  const { events } = context;
  const search = usePdfSearchBar(document, scrollRoot);
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
    layers: textLayers.layers,
    layersVersion: textLayers.version,
    scrollRoot,
    viewport,
    scrollToPage,
    scale,
    rotation,
  });
  useTextSelect({ scrollRoot, scale, rotation, onTextSelect: events.onTextSelect });
  const markup = useMarkup(context.markup, announce);
  const pdfLayers = usePdfLayers(document);
  const layers = { config: pdfLayers.config, version: pdfLayers.version };
  const linkService = useLinkService({ document, currentPage, scale, scrollToPage, events });

  return { search, textLayers, passage, markup, pdfLayers, layers, linkService };
}

export type PdfPageContent = ReturnType<typeof usePdfPageContent>;
