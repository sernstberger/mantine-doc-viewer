import { getEditedFileName } from './page-edits';

describe('getEditedFileName', () => {
  it('names edited files after the original', () => {
    expect(getEditedFileName('report.PDF', 'edited')).toBe('report-edited.pdf');
    expect(getEditedFileName(undefined, 'pages')).toBe('document-pages.pdf');
  });
});
