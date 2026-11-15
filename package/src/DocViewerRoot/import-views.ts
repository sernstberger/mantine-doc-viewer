/** Kept in its own module so tests can replace the dynamic imports, see jest.config.cjs */
export const importCodeView = () => import('../DocViewerCode/CodeView');
export const importMarkdownView = () => import('../DocViewerMarkdown/MarkdownView');
