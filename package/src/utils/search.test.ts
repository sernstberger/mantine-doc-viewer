import {
  buildPageText,
  findMatches,
  getMatchRanges,
  getMatchSegments,
  normalizeForSearch,
} from './search';

const items = [
  { str: 'Quarterly report', hasEOL: true },
  { str: 'Revenue grew ', hasEOL: false },
  { str: 'in the third', hasEOL: false },
  { str: ' quarter.', hasEOL: true },
];

describe('pdf search', () => {
  it('joins items and keeps a space where lines end', () => {
    const page = buildPageText(items);
    expect(page.text).toBe('Quarterly report Revenue grew in the third quarter. ');
    expect(page.itemStarts).toEqual([0, 17, 30, 42]);
  });

  it('does not double up spaces at line ends', () => {
    expect(buildPageText([{ str: 'Ends with space ', hasEOL: true }]).text).toBe(
      'Ends with space '
    );
  });

  it('finds every case-insensitive match on every page', () => {
    const pages = [buildPageText(items), buildPageText([{ str: 'Next quarter', hasEOL: false }])];
    expect(findMatches(pages, 'QUARTER')).toEqual([
      { pageNumber: 1, start: 0, end: 7 },
      { pageNumber: 1, start: 43, end: 50 },
      { pageNumber: 2, start: 5, end: 12 },
    ]);
  });

  it('ignores empty queries and surrounding whitespace', () => {
    const pages = [buildPageText(items)];
    expect(findMatches(pages, '   ')).toEqual([]);
    expect(findMatches(pages, ' grew ')).toEqual([{ pageNumber: 1, start: 25, end: 29 }]);
  });

  it('splits a match that crosses text items', () => {
    const page = buildPageText(items);
    const [match] = findMatches([page], 'third quarter');
    expect(getMatchSegments(page, match, items)).toEqual([
      { itemIndex: 2, start: 7, end: 12 },
      { itemIndex: 3, start: 0, end: 8 },
    ]);
  });

  it('skips the space that joins two items', () => {
    const page = buildPageText(items);
    const [match] = findMatches([page], 'report revenue');
    expect(getMatchSegments(page, { ...match, start: match.start + 6 }, items)).toEqual([
      { itemIndex: 1, start: 0, end: 7 },
    ]);
  });

  it('creates ranges on the text nodes of rendered spans', () => {
    const page = buildPageText(items);
    const textDivs = items.map((item) => {
      const span = document.createElement('span');
      span.textContent = item.str;
      return span;
    });

    const [match] = findMatches([page], 'third quarter');
    const ranges = getMatchRanges(getMatchSegments(page, match, items), textDivs);
    expect(ranges.map((range) => range.toString())).toEqual(['third', ' quarter']);
  });

  it('skips spans that are missing or no longer hold the same text', () => {
    const page = buildPageText(items);
    const [match] = findMatches([page], 'report');
    const segments = getMatchSegments(page, match, items);
    const shortSpan = document.createElement('span');
    shortSpan.textContent = 'Q';
    expect(getMatchRanges(segments, [])).toEqual([]);
    expect(getMatchRanges(segments, [shortSpan])).toEqual([]);
  });

  it('keeps match offsets when lowercasing changes the length of a character', () => {
    const page = buildPageText([{ str: 'İstanbul report', hasEOL: true }]);
    const [match] = findMatches([page], 'REPORT');
    expect(page.text.slice(match.start, match.end)).toBe('report');
  });

  describe('options', () => {
    const page = buildPageText([
      { str: 'Café menu. Cafe prices, cafeteria and CAFE hours.', hasEOL: true },
    ]);
    const found = (query: string, options = {}) =>
      findMatches([page], query, options).map((match) => page.text.slice(match.start, match.end));

    it('ignores case and accents by default', () => {
      expect(found('cafe')).toEqual(['Café', 'Cafe', 'cafe', 'CAFE']);
    });

    it('matches case', () => {
      expect(found('Cafe', { matchCase: true })).toEqual(['Café', 'Cafe']);
    });

    it('matches accents', () => {
      expect(found('café', { matchAccents: true })).toEqual(['Café']);
    });

    it('matches whole words only', () => {
      expect(found('cafe', { wholeWords: true })).toEqual(['Café', 'Cafe', 'CAFE']);
    });

    it('keeps offsets for characters that change length', () => {
      expect(normalizeForSearch('ﬁne İstanbul', {})).toHaveLength('ﬁne İstanbul'.length);
      expect(normalizeForSearch('Exact', { matchCase: true, matchAccents: true })).toBe('Exact');
    });

    it('changes only capitals and characters outside ASCII', () => {
      expect(normalizeForSearch('ÀB 😀 c-1', {})).toBe('ab 😀 c-1');
      expect(normalizeForSearch('ÀB 😀 c-1', { matchCase: true })).toBe('AB 😀 c-1');
      expect(normalizeForSearch('ÀB', { matchAccents: true })).toBe('àb');
    });

    it('normalises a page once per set of options, not once per query', () => {
      const cached = buildPageText([{ str: 'Alpha beta', hasEOL: false }]);
      expect(findMatches([cached], 'alpha')).toHaveLength(1);
      // The text of a page never changes; a changed one shows whether the cache was read
      (cached as { text: string }).text = 'Gamma delta';
      expect(findMatches([cached], 'beta')).toHaveLength(1);
      expect(findMatches([cached], 'Gamma', { matchCase: true })).toHaveLength(1);
    });
  });
});
