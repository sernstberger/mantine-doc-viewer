/** Kept in its own module so tests can replace the dynamic import, see jest.config.cjs */
export const importPdfJs = (): Promise<typeof import('pdfjs-dist')> => import('pdfjs-dist');
