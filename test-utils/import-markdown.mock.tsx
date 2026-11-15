import React from 'react';

/** react-markdown is ESM only and cannot be loaded by Jest, markdown rendering is checked in Storybook */
function Markdown({ children }: { children: string }) {
  return <div data-testid="markdown">{children}</div>;
}

export const importMarkdown = () =>
  Promise.resolve({ Markdown, remarkGfm: () => {}, defaultUrlTransform: (url: string) => url });
