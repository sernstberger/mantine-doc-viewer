import * as pdfjs from 'pdfjs-dist';

/** Jest runs CommonJS, where a dynamic import() of pdfjs-dist cannot be resolved */
export const importPdfJs = () => Promise.resolve(pdfjs);
