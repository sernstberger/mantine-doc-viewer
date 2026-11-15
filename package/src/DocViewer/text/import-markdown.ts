/** Kept in its own module so that tests can replace the dynamic import, see jest.config.cjs */
export const importMarkdown = () =>
  Promise.all([import('react-markdown'), import('remark-gfm')]).then(
    ([reactMarkdown, remarkGfm]) => ({
      Markdown: reactMarkdown.default,
      defaultUrlTransform: reactMarkdown.defaultUrlTransform,
      remarkGfm: remarkGfm.default,
    })
  );

export type MarkdownModule = Awaited<ReturnType<typeof importMarkdown>>;
