/** Page numbers (from 1) in the order the edited document will have them */
export type PageOrder = number[];

export function initialOrder(numPages: number): PageOrder {
  return Array.from({ length: numPages }, (_, index) => index + 1);
}

/**
 * Request for pdf.js `extractPages()` that builds a document with `order`'s pages in that order:
 * the pages to keep (0-based, ascending, as pdf.js filters them) and where each one goes
 */
export function buildExtractRequest(order: PageOrder) {
  const kept = [...order].sort((a, b) => a - b);
  return [
    {
      document: null,
      includePages: kept.map((page) => page - 1),
      pageIndices: kept.map((page) => order.indexOf(page)),
    },
  ];
}

/** Moves the selected pages one step earlier (-1) or later (1), keeping them in their order */
export function moveSelected(
  order: PageOrder,
  selected: Set<number>,
  direction: -1 | 1
): PageOrder {
  const next = [...order];
  const indices = next
    .map((page, index) => (selected.has(page) ? index : -1))
    .filter((i) => i >= 0);
  const ordered = direction === -1 ? indices : [...indices].reverse();

  ordered.forEach((index) => {
    const target = index + direction;
    if (target < 0 || target >= next.length || selected.has(next[target])) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
  });
  return next;
}

/** Moves one page to a new position, as a drag and drop does */
export function movePage(order: PageOrder, page: number, toIndex: number): PageOrder {
  const next = order.filter((item) => item !== page);
  next.splice(Math.min(Math.max(toIndex, 0), next.length), 0, page);
  return next;
}

/** Removes the selected pages, never the last one: a PDF needs at least one page */
export function removeSelected(order: PageOrder, selected: Set<number>): PageOrder {
  const next = order.filter((page) => !selected.has(page));
  return next.length > 0 ? next : order;
}

export function isEdited(order: PageOrder, numPages: number) {
  return order.length !== numPages || order.some((page, index) => page !== index + 1);
}

/** File name for a saved or extracted document, from the original */
export function getEditedFileName(fileName: string | undefined, suffix: string) {
  const base = (fileName ?? 'document.pdf').replace(/\.pdf$/i, '');
  return `${base}-${suffix}.pdf`;
}

export type PdfSaveReason = 'save' | 'extract' | 'reorder' | 'delete' | 'annotate';
