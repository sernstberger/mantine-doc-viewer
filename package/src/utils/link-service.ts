import { clamp } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';

type Destination = string | unknown[] | null | undefined;

export interface ResolvedDestination {
  /** Page counted from 1 */
  page: number;

  /** Distance from the top of the page in PDF units, when the destination names one */
  top?: number;
}

/** Page, and position on it, that a PDF destination (named or explicit) points to */
export async function resolveDestination(
  document: PDFDocumentProxy,
  dest: Destination
): Promise<ResolvedDestination | null> {
  const explicit = typeof dest === 'string' ? await document.getDestination(dest) : dest;
  if (!Array.isArray(explicit) || explicit.length === 0) {
    return null;
  }

  const [target, mode, ...args] = explicit as [
    unknown,
    { name?: string } | undefined,
    ...unknown[],
  ];
  const page = await getTargetPage(document, target);
  if (page === null) {
    return null;
  }

  const y = getDestinationY(mode?.name, args);
  if (y === null) {
    return { page };
  }

  return { page, top: getTopOffset((await document.getPage(page)).view, y) };
}

/** Page counted from 1 that a destination's first entry points to: a page index or a page reference */
async function getTargetPage(document: PDFDocumentProxy, target: unknown) {
  if (typeof target === 'number') {
    return target + 1;
  }
  if (target && typeof target === 'object') {
    return (
      (await document.getPageIndex(target as Parameters<PDFDocumentProxy['getPageIndex']>[0])) + 1
    );
  }
  return null;
}

/** Where each destination type keeps its top: /XYZ left top zoom, /FitH top and /FitBH top */
const TOP_ARGUMENT: Record<string, number> = { XYZ: 1, FitH: 0, FitBH: 0 };

/** The y coordinate a destination names, in PDF units from the bottom of the page */
export function getDestinationY(mode: string | undefined, args: unknown[]): number | null {
  const index = mode === undefined ? undefined : TOP_ARGUMENT[mode];
  const y = index === undefined ? null : args[index];
  return typeof y === 'number' ? y : null;
}

/** Distance from the top of the page box to `y`, which PDF counts from the bottom */
export function getTopOffset(view: number[], y: number) {
  return Math.max(0, view[3] - y);
}

/** Links to these protocols open; anything else (javascript:, file:, data:) is not clickable */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isSafeLinkUrl(url: string) {
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface LinkServiceHandlers {
  numPages: number;
  getCurrentPage: () => number;
  goToDestination: (destination: ResolvedDestination) => void;

  /** Called when a web link is clicked, `event.preventDefault()` stops it from opening */
  onLinkClick: (url: string, event: MouseEvent) => void;
}

/**
 * The part of pdf.js's link service that its AnnotationLayer uses for links. Links inside the
 * document scroll the viewer and never change the url of the page around it; web links always
 * open in a new tab, so a link in a document never navigates away from the app
 */
export function createLinkService(document: PDFDocumentProxy, handlers: LinkServiceHandlers) {
  const goToPage = (page: number) =>
    handlers.goToDestination({ page: clamp(page, 1, handlers.numPages) });

  return {
    externalLinkEnabled: true,
    eventBus: undefined,

    addLinkAttributes(link: HTMLAnchorElement, url: string) {
      if (!isSafeLinkUrl(url)) {
        link.removeAttribute('href');
        return;
      }

      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer nofollow';
      link.onclick = (event) => handlers.onLinkClick(url, event);
    },

    getDestinationHash: () => '#',
    getAnchorUrl: (hash: string) => `#${hash}`,

    async goToDestination(dest: Destination) {
      const destination = await resolveDestination(document, dest).catch(() => null);
      destination && handlers.goToDestination(destination);
    },

    executeNamedAction(action: string) {
      const current = handlers.getCurrentPage();
      const pages: Record<string, number> = {
        NextPage: current + 1,
        PrevPage: current - 1,
        FirstPage: 1,
        LastPage: handlers.numPages,
      };
      action in pages && goToPage(pages[action]);
    },

    executeSetOCGState() {},
    async getAttachmentContent() {
      return null;
    },
  };
}

export type PdfLinkService = ReturnType<typeof createLinkService>;
