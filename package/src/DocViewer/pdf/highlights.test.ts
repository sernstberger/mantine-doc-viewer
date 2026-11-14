import { ACTIVE_MATCH_HIGHLIGHT, addHighlightRanges, MATCH_HIGHLIGHT } from './highlights';

class FakeHighlight extends Set<Range> {
  priority = 0;
}

describe('pdf search highlights', () => {
  const registry = new Map<string, FakeHighlight>();

  beforeAll(() => {
    (globalThis as any).Highlight = FakeHighlight;
    (CSS as any).highlights = registry;
  });

  afterAll(() => {
    delete (globalThis as any).Highlight;
    delete (CSS as any).highlights;
  });

  it('shares one highlight between viewers and removes it once empty', () => {
    const first = [document.createRange()];
    const second = [document.createRange(), document.createRange()];

    const removeFirst = addHighlightRanges(MATCH_HIGHLIGHT, first);
    const removeSecond = addHighlightRanges(MATCH_HIGHLIGHT, second);
    expect(registry.get(MATCH_HIGHLIGHT)?.size).toBe(3);

    removeFirst();
    expect(registry.get(MATCH_HIGHLIGHT)?.size).toBe(2);
    removeSecond();
    expect(registry.has(MATCH_HIGHLIGHT)).toBe(false);
  });

  it('paints the active match above other matches', () => {
    const remove = addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, [document.createRange()]);
    expect(registry.get(ACTIVE_MATCH_HIGHLIGHT)?.priority).toBe(1);
    remove();
  });

  it('does nothing without ranges', () => {
    addHighlightRanges(MATCH_HIGHLIGHT, [])();
    expect(registry.size).toBe(0);
  });
});
