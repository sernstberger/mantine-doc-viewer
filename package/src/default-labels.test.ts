import { DEFAULT_LABELS, mergeLabels } from './default-labels';

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

  it('merges a subset of propertyNameLabels over the defaults', () => {
    const merged = mergeLabels(DEFAULT_LABELS, { propertyNameLabels: { author: 'Autor' } });
    expect(merged.propertyNameLabels.author).toBe('Autor');
    expect(merged.propertyNameLabels.title).toBe(DEFAULT_LABELS.propertyNameLabels.title);
    expect(merged.printLabel).toBe(DEFAULT_LABELS.printLabel);
    expect(mergeLabels(DEFAULT_LABELS, undefined)).toEqual(DEFAULT_LABELS);
  });
});
