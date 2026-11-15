import { detectDocType, getCodeLanguage } from './detect-doc-type';

describe('detectDocType', () => {
  it.each([
    ['report.pdf', 'pdf'],
    ['https://example.com/files/Report.PDF?token=abc#page=2', 'pdf'],
    ['photo.jpeg', 'image'],
    ['/icons/logo.svg', 'image'],
    ['README.md', 'markdown'],
    ['App.tsx', 'code'],
    ['data.json', 'code'],
    ['notes.txt', 'text'],
    ['archive.zip', 'unknown'],
    ['no-extension', 'unknown'],
    ['.env', 'unknown'],
  ])('detects %s as %s', (src, expected) => {
    expect(detectDocType({ src })).toBe(expected);
  });

  it('prefers the MIME type over the extension', () => {
    expect(detectDocType({ src: 'download.bin', mimeType: 'application/pdf' })).toBe('pdf');
    expect(detectDocType({ src: 'file', mimeType: 'text/plain; charset=utf-8' })).toBe('text');
  });

  it('falls back to the extension when the MIME type is not recognised', () => {
    expect(detectDocType({ src: 'a.png', mimeType: 'application/octet-stream' })).toBe('image');
  });

  it('reads the MIME type from data urls', () => {
    expect(detectDocType({ src: 'data:image/png;base64,AAAA' })).toBe('image');
    expect(detectDocType({ src: 'data:application/pdf;base64,AAAA' })).toBe('pdf');
  });

  it('uses fileName for blob urls', () => {
    expect(detectDocType({ src: 'blob:https://example.com/1234', fileName: 'scan.pdf' })).toBe(
      'pdf'
    );
  });

  it('maps file extensions to highlighter languages', () => {
    expect(getCodeLanguage({ src: '/src/App.tsx' })).toBe('tsx');
    expect(getCodeLanguage({ src: 'build.mjs' })).toBe('js');
    expect(getCodeLanguage({ src: 'script.py?raw=1' })).toBe('python');
    expect(getCodeLanguage({ src: 'blob:abc', fileName: 'config.yml' })).toBe('yaml');
    expect(getCodeLanguage({ src: 'README' })).toBeUndefined();
  });
});
