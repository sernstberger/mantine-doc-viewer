import type { DocViewerMark } from './markup';

/** No marks on a page: one array for all of them, so pages without marks keep their props */
export const NO_MARKS: DocViewerMark[] = [];

const sameMarks = (a: DocViewerMark[], b: DocViewerMark[]) =>
  a.length === b.length && a.every((mark, index) => mark === b[index]);

/**
 * The marks of each page, in the order they were made. A page whose marks are the same as in
 * `previous` keeps its array from there, so only the pages whose marks changed get a new one
 */
export function groupMarksByPage(
  marks: DocViewerMark[],
  previous?: ReadonlyMap<number, DocViewerMark[]>
): ReadonlyMap<number, DocViewerMark[]> {
  const groups = new Map<number, DocViewerMark[]>();
  marks.forEach((mark) => {
    const group = groups.get(mark.page);
    group ? group.push(mark) : groups.set(mark.page, [mark]);
  });
  groups.forEach((group, page) => {
    const kept = previous?.get(page);
    kept && sameMarks(kept, group) && groups.set(page, kept);
  });
  return groups;
}
