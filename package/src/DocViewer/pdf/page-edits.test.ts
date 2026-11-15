import {
  buildExtractRequest,
  getEditedFileName,
  initialOrder,
  isEdited,
  movePage,
  moveSelected,
  removeSelected,
} from './page-edits';

describe('page edits', () => {
  it('builds an extract request that keeps the order', () => {
    expect(buildExtractRequest([3, 1, 2])).toEqual([
      { document: null, includePages: [0, 1, 2], pageIndices: [1, 2, 0] },
    ]);
    expect(buildExtractRequest([4, 2])).toEqual([
      { document: null, includePages: [1, 3], pageIndices: [1, 0] },
    ]);
  });

  it('moves selected pages a step, without passing other selected pages', () => {
    expect(moveSelected([1, 2, 3, 4], new Set([3]), -1)).toEqual([1, 3, 2, 4]);
    expect(moveSelected([1, 2, 3, 4], new Set([2, 3]), 1)).toEqual([1, 4, 2, 3]);
    expect(moveSelected([1, 2, 3, 4], new Set([1, 2]), -1)).toEqual([1, 2, 3, 4]);
    expect(moveSelected([1, 2, 3, 4], new Set([4]), 1)).toEqual([1, 2, 3, 4]);
  });

  it('moves a page to a position', () => {
    expect(movePage([1, 2, 3, 4], 4, 0)).toEqual([4, 1, 2, 3]);
    expect(movePage([1, 2, 3, 4], 1, 9)).toEqual([2, 3, 4, 1]);
  });

  it('removes pages but never all of them', () => {
    expect(removeSelected([1, 2, 3], new Set([2]))).toEqual([1, 3]);
    expect(removeSelected([1, 2, 3], new Set([1, 2, 3]))).toEqual([1, 2, 3]);
  });

  it('knows when the order changed', () => {
    expect(isEdited(initialOrder(3), 3)).toBe(false);
    expect(isEdited([2, 1, 3], 3)).toBe(true);
    expect(isEdited([1, 2], 3)).toBe(true);
  });

  it('names edited files after the original', () => {
    expect(getEditedFileName('report.PDF', 'edited')).toBe('report-edited.pdf');
    expect(getEditedFileName(undefined, 'pages')).toBe('document-pages.pdf');
  });
});
