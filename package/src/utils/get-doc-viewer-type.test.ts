import { getDocViewerType, getCodeLanguage } from './get-doc-viewer-type';

describe('getDocViewerType', () => {
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
    expect(getDocViewerType({ src })).toBe(expected);
  });

  it('prefers the MIME type over the extension', () => {
    expect(getDocViewerType({ src: 'download.bin', mimeType: 'application/pdf' })).toBe('pdf');
    expect(getDocViewerType({ src: 'file', mimeType: 'text/plain; charset=utf-8' })).toBe('text');
  });

  it('falls back to the extension when the MIME type is not recognised', () => {
    expect(getDocViewerType({ src: 'a.png', mimeType: 'application/octet-stream' })).toBe('image');
  });

  it('reads the MIME type from data urls', () => {
    expect(getDocViewerType({ src: 'data:image/png;base64,AAAA' })).toBe('image');
    expect(getDocViewerType({ src: 'data:application/pdf;base64,AAAA' })).toBe('pdf');
  });

  it('uses fileName for blob urls', () => {
    expect(getDocViewerType({ src: 'blob:https://example.com/1234', fileName: 'scan.pdf' })).toBe(
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

describe('detection from the MIME type, data urls and file names together', () => {
  it('detects languages and types', () => {
    expect(getCodeLanguage({ src: '/a/b.py' })).toBe('python');
    expect(getCodeLanguage({ src: 'blob:x', fileName: 'x.ts' })).toBe('ts');
    expect(getCodeLanguage({ src: 'blob:x' })).toBeUndefined();
    expect(getDocViewerType({ mimeType: 'text/plain' })).toBe('text');
    expect(getDocViewerType({ mimeType: 'application/x-weird', src: 'a.pdf' })).toBe('pdf');
    expect(getDocViewerType({ src: 'data:image/png;base64,AAAA' })).toBe('image');
    expect(getDocViewerType({ src: 'data:application/x-weird,1', fileName: 'a.md' })).toBe(
      'markdown'
    );
    expect(getDocViewerType({ src: '/a.json' })).toBe('code');
    expect(getDocViewerType({ src: '/a.csv' })).toBe('text');
    expect(getDocViewerType({ src: '/a.zip' })).toBe('unknown');
    expect(getDocViewerType({ mimeType: 'text/markdown' })).toBe('markdown');
    expect(getDocViewerType({ mimeType: 'application/json' })).toBe('code');
    expect(getDocViewerType({})).toBe('unknown');
  });
});
