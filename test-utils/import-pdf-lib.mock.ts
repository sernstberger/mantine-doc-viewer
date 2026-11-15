import * as pdfLib from '@cantoo/pdf-lib';

/** Jest runs CommonJS, where a dynamic import() is not resolved: give the real pdf-lib */
export const importPdfLib = () => Promise.resolve(pdfLib);
