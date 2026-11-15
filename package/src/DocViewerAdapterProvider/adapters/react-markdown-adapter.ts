/** The markdown renderer and its GFM plugin as the viewer uses them, typed by their shape */
export interface DocViewerMarkdownEngine {
  Markdown: React.ComponentType<any>;
  defaultUrlTransform: (url: string) => string;
  remarkGfm: unknown;
}

export interface DocViewerMarkdownAdapter {
  /** Loads the engine; the adapter loads it once */
  load: () => Promise<DocViewerMarkdownEngine>;
}

interface ReactMarkdownModule {
  default: React.ComponentType<any>;
  defaultUrlTransform: (url: string) => string;
}

/**
 * Markdown engine for `DocViewerAdapterProvider`, with the markdown renderer and its GFM plugin
 * loaded by the app through dynamic imports, resolving to both modules as a pair
 */
export function createReactMarkdownAdapter(
  load: () => Promise<[unknown, unknown]>
): DocViewerMarkdownAdapter {
  let engine: Promise<DocViewerMarkdownEngine> | null = null;

  return {
    load: () => {
      engine ??= load().then(
        ([reactMarkdown, remarkGfm]) => {
          const markdown = reactMarkdown as ReactMarkdownModule;
          return {
            Markdown: markdown.default,
            defaultUrlTransform: markdown.defaultUrlTransform,
            remarkGfm: (remarkGfm as { default: unknown }).default,
          };
        },
        (error) => {
          engine = null;
          throw error;
        }
      );
      return engine;
    },
  };
}
