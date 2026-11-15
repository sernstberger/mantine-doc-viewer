import * as pdfjs from 'pdfjs-dist';
/** Makes the next importPdfJs() call give this instead of the pdfjs-dist test double, for load failures */
export declare function setNextPdfJsImport(load: () => Promise<unknown>): void;
/** Jest runs CommonJS, where a dynamic import() of pdfjs-dist cannot be resolved */
export declare const importPdfJs: () => Promise<typeof pdfjs>;
