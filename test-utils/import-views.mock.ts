import * as codeView from '../package/src/DocViewer/text/CodeView';
import * as markdownView from '../package/src/DocViewer/text/MarkdownView';

/** Jest runs CommonJS, where a dynamic import() is not resolved: give the real views */
export const importCodeView = () => Promise.resolve(codeView);
export const importMarkdownView = () => Promise.resolve(markdownView);
