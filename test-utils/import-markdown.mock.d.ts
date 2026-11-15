import React from 'react';
/** react-markdown is ESM only and cannot be loaded by Jest, markdown rendering is checked in Storybook */
declare function Markdown({ children }: {
    children: string;
}): React.JSX.Element;
declare const defaultModule: {
    Markdown: typeof Markdown;
    remarkGfm: () => void;
    defaultUrlTransform: (url: string) => string;
};
/** Makes importMarkdown() give this until reset, for a module that fails or never loads */
export declare function setMarkdownImport(load: () => Promise<unknown>): void;
export declare function resetMarkdownImport(): void;
export declare const importMarkdown: () => Promise<typeof defaultModule>;
export {};
