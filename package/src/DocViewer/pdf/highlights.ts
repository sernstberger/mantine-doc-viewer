/**
 * Search highlights use the CSS Custom Highlight API: ranges are painted without touching the
 * text layer DOM that pdf.js owns. Highlight names are global, so every viewer on the page
 * adds its own ranges to the same two highlights and removes them on cleanup.
 * Browsers without the API still search and scroll to matches, only without highlights.
 */
export const MATCH_HIGHLIGHT = 'mantine-doc-viewer-match';
export const ACTIVE_MATCH_HIGHLIGHT = 'mantine-doc-viewer-active-match';

type HighlightName = typeof MATCH_HIGHLIGHT | typeof ACTIVE_MATCH_HIGHLIGHT;

function getRegistry() {
  if (typeof CSS === 'undefined' || !('highlights' in CSS) || typeof Highlight === 'undefined') {
    return null;
  }

  return CSS.highlights;
}

export function supportsHighlights() {
  return getRegistry() !== null;
}

/** Adds ranges to a shared highlight and returns a function that removes them */
export function addHighlightRanges(name: HighlightName, ranges: Range[]) {
  const registry = getRegistry();
  if (!registry || ranges.length === 0) {
    return () => {};
  }

  const highlight = registry.get(name) ?? new Highlight();
  if (!registry.has(name)) {
    highlight.priority = name === ACTIVE_MATCH_HIGHLIGHT ? 1 : 0;
    registry.set(name, highlight);
  }

  ranges.forEach((range) => highlight.add(range));

  return () => {
    ranges.forEach((range) => highlight.delete(range));
    if (highlight.size === 0) {
      registry.delete(name);
    }
  };
}
