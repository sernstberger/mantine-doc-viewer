/** The selection with this page added, or removed when it was in it */
export function toggleSelection(selected: Set<number>, page: number): Set<number> {
  const next = new Set(selected);
  next.has(page) ? next.delete(page) : next.add(page);
  return next;
}

/** The selection after a plain click: only this page, or nothing when it was the only one */
export function clickSelection(selected: Set<number>, page: number): Set<number> {
  return new Set(selected.has(page) && selected.size === 1 ? [] : [page]);
}

/** Quarter turns per page, with each of these pages turned another 90 degrees clockwise */
export function turnPages(
  rotations: Record<number, number>,
  pages: Iterable<number>
): Record<number, number> {
  const next = { ...rotations };
  for (const page of pages) {
    next[page] = ((rotations[page] ?? 0) + 90) % 360;
  }
  return next;
}
