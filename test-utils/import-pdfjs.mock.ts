import * as pdfjs from 'pdfjs-dist';

let nextImport: (() => Promise<unknown>) | null = null;

/** Makes the next importPdfJs() call give this instead of the pdfjs-dist test double, for load failures */
export function setNextPdfJsImport(load: () => Promise<unknown>) {
  nextImport = load;
}

/** Jest runs CommonJS, where a dynamic import() of pdfjs-dist cannot be resolved */
export const importPdfJs = () => {
  const load = nextImport;
  nextImport = null;
  return (load ? load() : Promise.resolve(pdfjs)) as Promise<typeof pdfjs>;
};
