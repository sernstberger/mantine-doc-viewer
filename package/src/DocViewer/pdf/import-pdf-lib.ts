/** Kept in its own module so tests can replace the dynamic import, see jest.config.cjs. Loaded only when a page edit turns pages */
export const importPdfLib = () => import('pdf-lib');
