import { DEFAULT_LABELS } from './default-labels';

describe('page editor DEFAULT_LABELS', () => {
  it('formats every label function', () => {
    const l = DEFAULT_LABELS;
    expect(l.deletePageLabel(2)).toBe('Delete page 2');
    expect(l.selectedCountLabel(3)).toBe('3 selected');
    expect(l.editorPageLabel(2, 3, 4)).toBe('Page 2, position 3 of 4');
    expect(l.pageMovedLabel(2, 3)).toBe('Page 2 moved to position 3');
    expect(l.pagesRemovedLabel(1)).toBe('1 page removed');
    expect(l.pagesRemovedLabel(3)).toBe('3 pages removed');
    expect(l.pagesRotatedLabel(1)).toBe('1 page turned');
    expect(l.pagesRotatedLabel(2)).toBe('2 pages turned');
  });
});
