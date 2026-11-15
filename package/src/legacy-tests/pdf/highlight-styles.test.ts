class FakeHighlight extends Set<Range> {
  priority = 0;
}

class FakeStyleSheet {
  text = '';
  replaceSync(text: string) {
    this.text = text;
  }
}

/** A fresh copy of highlights.ts, which adds its styles only once per page */
function loadHighlights(): typeof import('../../utils/highlights') {
  let module!: typeof import('../../utils/highlights');
  jest.isolateModules(() => {
    module = require('../../utils/highlights');
  });
  return module;
}

describe('highlight styles', () => {
  const originalStyleSheet = (globalThis as any).CSSStyleSheet;

  beforeEach(() => {
    (globalThis as any).Highlight = FakeHighlight;
    (CSS as any).highlights = new Map();
  });

  afterEach(() => {
    delete (globalThis as any).Highlight;
    delete (CSS as any).highlights;
    delete (document as any).adoptedStyleSheets;
    (globalThis as any).CSSStyleSheet = originalStyleSheet;
  });

  it('adds the highlight colours once, as a constructed stylesheet', () => {
    (globalThis as any).CSSStyleSheet = FakeStyleSheet;
    Object.defineProperty(document, 'adoptedStyleSheets', {
      value: [],
      writable: true,
      configurable: true,
    });
    const { addHighlightRanges, HIGHLIGHT_CSS, MATCH_HIGHLIGHT, ACTIVE_MATCH_HIGHLIGHT } =
      loadHighlights();

    addHighlightRanges(MATCH_HIGHLIGHT, [document.createRange()]);
    addHighlightRanges(ACTIVE_MATCH_HIGHLIGHT, [document.createRange()]);

    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect((document.adoptedStyleSheets[0] as unknown as FakeStyleSheet).text).toBe(HIGHLIGHT_CSS);
    expect(HIGHLIGHT_CSS).toContain(`::highlight(${MATCH_HIGHLIGHT})`);
    expect(HIGHLIGHT_CSS).toContain(`::highlight(${ACTIVE_MATCH_HIGHLIGHT})`);
  });

  it('still highlights where constructed stylesheets are not available', () => {
    (globalThis as any).CSSStyleSheet = undefined;
    const { addHighlightRanges, MATCH_HIGHLIGHT } = loadHighlights();

    addHighlightRanges(MATCH_HIGHLIGHT, [document.createRange()]);
    expect((CSS as any).highlights.get(MATCH_HIGHLIGHT).size).toBe(1);
  });

  it('skips documents without adoptedStyleSheets', () => {
    (globalThis as any).CSSStyleSheet = FakeStyleSheet;
    const { addHighlightRanges, MATCH_HIGHLIGHT } = loadHighlights();

    addHighlightRanges(MATCH_HIGHLIGHT, [document.createRange()]);
    expect('adoptedStyleSheets' in document).toBe(false);
  });
});
