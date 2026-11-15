import * as pdfLib from 'pdf-lib';

/** Jest runs CommonJS, where a dynamic import() is not resolved: give the real pdf-lib */
export const importPdfLib = () => Promise.resolve(pdfLib);
