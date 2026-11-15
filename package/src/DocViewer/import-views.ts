/** Kept in its own module so tests can replace the dynamic imports, see jest.config.cjs */
export const importCodeView = () => import('./text/CodeView');
export const importMarkdownView = () => import('./text/MarkdownView');
