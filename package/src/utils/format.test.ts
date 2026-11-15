import { formatFileSize } from '../hooks/text/use-doc-viewer-text';
import { formatPageSize, getPdfProperties } from './document-info';
import { formatDateTime, formatPercent } from './format';

describe('locale formatting', () => {
  it('formats numbers, percentages and dates for the locale', () => {
    expect(formatPercent(1.25, 'de-DE')).toBe('125 %');
    expect(formatPercent(1.25, 'en-US')).toBe('125%');
    expect(formatFileSize(1536, 'de-DE')).toBe('1,5 KB');
    expect(formatFileSize(1536, 'en-US')).toBe('1.5 KB');
    expect(formatFileSize(10, 'de-DE')).toBe('10 B');
    expect(formatPageSize(612, 792, 'de-DE')).toBe('8,5 × 11 in (216 × 279 mm)');
    expect(formatDateTime(new Date(2024, 0, 31, 12, 30), 'de-DE')).toContain('31.01.2024');
  });

  it('formats the document properties for the locale', () => {
    const properties = getPdfProperties(
      {},
      { fileSize: 2560, pageCount: 1200, pageSize: { width: 612, height: 792 }, locale: 'de-DE' },
      () => ''
    );
    expect(properties.map((property) => property.value)).toEqual([
      '2,5 KB',
      '1.200',
      '8,5 × 11 in (216 × 279 mm)',
    ]);
  });

  it('formats file sizes', () => {
    expect(formatFileSize(10)).toBe('10 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });
});
