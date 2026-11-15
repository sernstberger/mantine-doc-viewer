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

export interface SearchOptions {
  /** Upper and lower case must match, off by default */
  matchCase?: boolean;

  /** Matches must be whole words, off by default */
  wholeWords?: boolean;

  /** Accents must match, off by default, so "cafe" also finds "café" */
  matchAccents?: boolean;
}

/** Characters that can change: ASCII capitals (when case is ignored) and anything not ASCII */
const CHANGING = { ignoreCase: /[A-Z]|[^\x00-\x7F]/gu, matchCase: /[^\x00-\x7F]/gu };

/**
 * Prepares text for matching one character at a time, so offsets in the result are offsets in
 * the original text. A character whose lowercase or unaccented form has a different length (such
 * as İ, or the ligature ﬁ) is kept as it is. Other ASCII characters never change, so only
 * capitals and non-ASCII characters are looked at
 */
export function normalizeForSearch(text: string, { matchCase, matchAccents }: SearchOptions) {
  if (matchCase && matchAccents) {
    return text;
  }

  return text.replace(matchCase ? CHANGING.matchCase : CHANGING.ignoreCase, (char) => {
    let next = matchCase ? char : char.toLowerCase();
    if (!matchAccents) {
      next = next.normalize('NFD').replace(/\p{M}/gu, '');
    }
    return next.length === char.length ? next : char;
  });
}

/** Normalised page text per page and options, so typing a query does not normalise every page again */
const haystacks = new WeakMap<PageText, Map<string, string>>();

function getHaystack(page: PageText, { matchCase = false, matchAccents = false }: SearchOptions) {
  let forPage = haystacks.get(page);
  if (!forPage) {
    forPage = new Map();
    haystacks.set(page, forPage);
  }

  const key = `${matchCase}:${matchAccents}`;
  let haystack = forPage.get(key);
  if (haystack === undefined) {
    haystack = normalizeForSearch(page.text, { matchCase, matchAccents });
    forPage.set(key, haystack);
  }

  return haystack;
}

const WORD_CHARACTER = /[\p{L}\p{N}_]/u;

function isWholeWord(text: string, start: number, end: number) {
  return !WORD_CHARACTER.test(text[start - 1] ?? '') && !WORD_CHARACTER.test(text[end] ?? '');
}

/** Search across pages, with match offsets in each page's original text */
export function findMatches(
  pages: PageText[],
  query: string,
  options: SearchOptions = {}
): SearchMatch[] {
  const needle = normalizeForSearch(query.trim(), options);
  if (!needle) {
    return [];
  }

  const matches: SearchMatch[] = [];
  pages.forEach((page, index) => {
    const haystack = getHaystack(page, options);
    let start = haystack.indexOf(needle);

    while (start !== -1) {
      const end = start + needle.length;
      if (!options.wholeWords || isWholeWord(haystack, start, end)) {
        matches.push({ pageNumber: index + 1, start, end });
      }
      start = haystack.indexOf(needle, options.wholeWords ? start + 1 : end);
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
