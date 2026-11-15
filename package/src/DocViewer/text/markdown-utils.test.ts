import {
  createSlugger,
  getFencedCode,
  HastNode,
  rehypeHeadingIds,
  resolveMarkdownUrl,
} from './markdown-utils';

describe('markdown utils', () => {
  const base = 'https://app.example.com/inbox/42';

  it('resolves relative urls against the markdown file', () => {
    expect(resolveMarkdownUrl('diagram.png', '/files/docs/README.md', base)).toBe(
      'https://app.example.com/files/docs/diagram.png'
    );
    expect(resolveMarkdownUrl('../setup.md', 'https://cdn.example.com/a/b/README.md', base)).toBe(
      'https://cdn.example.com/a/setup.md'
    );
  });

  it('leaves absolute urls and links within the document alone', () => {
    expect(resolveMarkdownUrl('https://mantine.dev', '/files/README.md', base)).toBe(
      'https://mantine.dev'
    );
    expect(resolveMarkdownUrl('mailto:hi@example.com', '/README.md', base)).toBe(
      'mailto:hi@example.com'
    );
    expect(resolveMarkdownUrl('#install', '/files/README.md', base)).toBe('#install');
  });

  it('reads the code and language of a fenced code block', () => {
    const pre = {
      type: 'element',
      tagName: 'pre',
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-tsx'] },
          children: [{ type: 'text', value: 'const a = 1;\n' }],
        },
      ],
    };

    expect(getFencedCode(pre)).toEqual({ code: 'const a = 1;', language: 'tsx' });
  });

  it('handles code blocks without a language and non-code pre elements', () => {
    expect(
      getFencedCode({
        type: 'element',
        tagName: 'pre',
        children: [{ type: 'element', tagName: 'code', children: [{ type: 'text', value: 'x' }] }],
      })
    ).toEqual({ code: 'x', language: undefined });
    expect(getFencedCode({ type: 'element', tagName: 'pre', children: [] })).toBeNull();
  });

  it('creates GitHub style heading ids', () => {
    const slug = createSlugger();
    expect(slug("What's new?")).toBe('whats-new');
    expect(slug('API & props')).toBe('api--props');
    expect(slug('Installation')).toBe('installation');
    expect(slug('Installation')).toBe('installation-1');
    expect(slug('Café menü')).toBe('café-menü');
  });

  it('gives headings the same ids however often the document is processed', () => {
    const heading = (text: string): HastNode => ({
      type: 'element',
      tagName: 'h2',
      children: [{ type: 'text', value: text }],
    });
    const tree: HastNode = { type: 'root', children: [heading('Install'), heading('Install')] };
    const ids = () => tree.children!.map((node) => node.properties?.id);

    rehypeHeadingIds()(tree);
    expect(ids()).toEqual(['install', 'install-1']);
    rehypeHeadingIds()(tree);
    expect(ids()).toEqual(['install', 'install-1']);
  });
});
