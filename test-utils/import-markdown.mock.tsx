/** react-markdown is ESM only and cannot be loaded by Jest, markdown rendering is checked in Storybook */
function Markdown({ children }: { children: string }) {
  return <div data-testid="markdown">{children}</div>;
}

const defaultModule = { Markdown, remarkGfm: () => {}, defaultUrlTransform: (url: string) => url };

let override: (() => Promise<unknown>) | null = null;

/** Makes importMarkdown() give this until reset, for a module that fails or never loads */
export function setMarkdownImport(load: () => Promise<unknown>) {
  override = load;
}

export function resetMarkdownImport() {
  override = null;
}

export const importMarkdown = () =>
  (override ? override() : Promise.resolve(defaultModule)) as Promise<typeof defaultModule>;
