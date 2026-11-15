/** Minimal shape of the hast nodes react-markdown passes to components */
export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: unknown; id?: unknown };
  children?: HastNode[];
}

/**
 * Relative links and images in a markdown file point next to the file, not next to the page
 * showing it, so they are resolved against the file url. Links within the document stay as is.
 */
export function resolveMarkdownUrl(url: string, documentSrc: string, baseUrl: string) {
  if (url.startsWith('#') || /^[a-z][a-z\d+\-.]*:/i.test(url)) {
    return url;
  }

  try {
    return new URL(url, new URL(documentSrc, baseUrl)).href;
  } catch {
    return url;
  }
}

export function getText(node: HastNode): string {
  return node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(getText).join('');
}

/** Code and language of a fenced code block, from the `<pre>` node react-markdown renders */
export function getFencedCode(pre: HastNode | undefined) {
  const code = pre?.children?.find((child) => child.type === 'element' && child.tagName === 'code');
  if (!code) {
    return null;
  }

  const classNames = Array.isArray(code.properties?.className) ? code.properties.className : [];
  const languageClass = classNames.find(
    (name): name is string => typeof name === 'string' && name.startsWith('language-')
  );

  return {
    code: getText(code).replace(/\n$/, ''),
    language: languageClass?.slice('language-'.length),
  };
}

/**
 * Heading ids the way GitHub creates them, so that `#section` links written for GitHub work.
 * Returns a function that adds -1, -2… to repeated headings, call it in document order.
 */
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Rehype plugin that gives headings GitHub-style ids. It runs once per render of the
 * whole document with a fresh slugger, so ids stay the same however often it renders
 */
export function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const slug = createSlugger();
    const visit = (node: HastNode) => {
      if (node.type === 'element' && node.tagName && HEADING_TAGS.has(node.tagName)) {
        node.properties = { ...node.properties, id: slug(getText(node)) };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function createSlugger() {
  const seen = new Map<string, number>();

  return (text: string) => {
    const base = text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}
