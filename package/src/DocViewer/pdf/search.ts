import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export interface PageText {
  /** All text items of the page joined, with a space where a line ends */
  text: string;

  /** Index in `text` where each text item starts, same order as text layer spans */
  itemStarts: number[];
}

export interface SearchMatch {
  pageNumber: number;

  /** Start of the match in `PageText.text` */
  start: number;

  /** End of the match in `PageText.text`, exclusive */
  end: number;
}

export function buildPageText(items: Pick<TextItem, 'str' | 'hasEOL'>[]): PageText {
  let text = '';
  const itemStarts: number[] = [];

  items.forEach((item) => {
    itemStarts.push(text.length);
    text += item.str;

    if (item.hasEOL && !text.endsWith(' ')) {
      text += ' ';
    }
  });

  return { text, itemStarts };
}

/**
 * Case-insensitive search across pages. Lowercasing keeps string length for the
 * scripts documents usually contain, so match offsets line up with the original text.
 */
/** Lowercases one character at a time, keeping characters whose lowercase is longer (such as İ) as they are */
function toLowerSameLength(text: string) {
  const lower = text.toLowerCase();
  if (lower.length === text.length) {
    return lower;
  }

  return Array.from(text, (char) => {
    const lowerChar = char.toLowerCase();
    return lowerChar.length === char.length ? lowerChar : char;
  }).join('');
}

export function findMatches(pages: PageText[], query: string): SearchMatch[] {
  const needle = toLowerSameLength(query.trim());
  if (!needle) {
    return [];
  }

  const matches: SearchMatch[] = [];
  pages.forEach((page, index) => {
    const haystack = toLowerSameLength(page.text);
    let start = haystack.indexOf(needle);

    while (start !== -1) {
      matches.push({ pageNumber: index + 1, start, end: start + needle.length });
      start = haystack.indexOf(needle, start + needle.length);
    }
  });

  return matches;
}

export interface MatchSegment {
  /** Index of the text item, and of the matching text layer span */
  itemIndex: number;
  start: number;
  end: number;
}

/** Splits a match into one segment per text item it touches */
export function getMatchSegments(page: PageText, match: SearchMatch, items: { str: string }[]) {
  const segments: MatchSegment[] = [];

  page.itemStarts.forEach((itemStart, itemIndex) => {
    const itemEnd = itemStart + items[itemIndex].str.length;
    const start = Math.max(match.start, itemStart);
    const end = Math.min(match.end, itemEnd);

    if (start < end) {
      segments.push({ itemIndex, start: start - itemStart, end: end - itemStart });
    }
  });

  return segments;
}

/** DOM ranges for a match inside a rendered text layer */
export function getMatchRanges(segments: MatchSegment[], textDivs: HTMLElement[]) {
  return segments.flatMap(({ itemIndex, start, end }) => {
    const node = textDivs[itemIndex]?.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE || end > (node.textContent?.length ?? 0)) {
      return [];
    }

    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    return [range];
  });
}
