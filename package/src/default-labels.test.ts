import { DEFAULT_LABELS } from './default-labels';

describe('DEFAULT_LABELS', () => {
  it('formats every default label function', () => {
    const l = DEFAULT_LABELS;
    expect(l.downloadAttachmentLabel('a.txt')).toBe('Download attachment a.txt');
    expect(l.pageOfLabel(1, 5)).toBe('Page 1 of 5');
    expect(l.thumbnailLabel(2)).toBe('Page 2');
    expect(l.linkToPageLabel(4)).toBe('Go to page 4');
    expect(l.matchOfLabel(1, 2)).toBe('1 of 2');
    expect(l.matchOnPageLabel(1, 2, 3)).toBe('Match 1 of 2, page 3');
    expect(l.tooLargeLabel('3 MB')).toBe('This file is too large to preview (3 MB)');
    expect(l.notSupportedYetLabel('pdf')).toBe('Preview for pdf files is not available yet');
  });
});
