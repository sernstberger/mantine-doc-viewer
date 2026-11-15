import { formatPageSize, getPdfProperties, parsePdfDate } from './document-info';
import { getLayers } from '../hooks/pdf/use-pdf-layers';

describe('document info', () => {
  it('parses PDF dates with and without a time zone', () => {
    expect(parsePdfDate("D:20240131120000+01'00'")?.toISOString()).toBe('2024-01-31T11:00:00.000Z');
    expect(parsePdfDate('D:20240131120000Z')?.toISOString()).toBe('2024-01-31T12:00:00.000Z');
    expect(parsePdfDate('D:2024')?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(parsePdfDate('not a date')).toBeNull();
    expect(parsePdfDate(undefined)).toBeNull();
  });

  it('shows page sizes in inches and millimetres', () => {
    expect(formatPageSize(612, 792)).toBe('8.5 × 11 in (216 × 279 mm)');
  });

  it('lists properties in order, without empty ones', () => {
    const properties = getPdfProperties(
      { Title: ' Report ', Author: '', CreationDate: 'D:20240131120000Z', PDFFormatVersion: '1.7' },
      { fileSize: 2048, pageCount: 3, pageSize: { width: 612, height: 792 } },
      (date) => date.toISOString().slice(0, 10)
    );
    expect(properties).toEqual([
      { key: 'title', value: 'Report' },
      { key: 'created', value: '2024-01-31' },
      { key: 'pdfVersion', value: '1.7' },
      { key: 'fileSize', value: '2.0 KB' },
      { key: 'pageCount', value: '3' },
      { key: 'pageSize', value: '8.5 × 11 in (216 × 279 mm)' },
    ]);
  });

  it('lists layers with their visibility', () => {
    const groups = new Map([
      ['1R', { name: 'Notes', visible: true }],
      ['2R', { name: '', visible: false }],
    ]);
    const config = { [Symbol.iterator]: () => groups[Symbol.iterator]() };
    expect(getLayers(config as never)).toEqual([
      { id: '1R', name: 'Notes', visible: true },
      { id: '2R', name: '2R', visible: false },
    ]);
    expect(getLayers(null)).toEqual([]);
  });
});
