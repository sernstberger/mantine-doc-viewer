import { CodeHighlight } from '@mantine/code-highlight';
import { VisuallyHidden } from '@mantine/core';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { getScrollBehavior } from '../utils/scroll';
import { getFencedCode, HastNode } from '../utils/markdown-utils';

/**
 * Scrolls the viewer to the heading a `#hash` link points to and moves focus to it, so keyboard
 * and screen reader users continue from there. Returns false when there is no such heading
 */
export function scrollToHeading(root: HTMLElement, hash: string) {
  const id = decodeURIComponent(hash).replace(/["\\]/g, '\\$&');
  const target = root.querySelector<HTMLElement>(`[id="${id}"]`);
  const scrollContainer = root.parentElement;
  if (!target || !scrollContainer) {
    return false;
  }

  const top =
    target.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top +
    scrollContainer.scrollTop;
  scrollContainer.scrollTo({ top: top - 12, behavior: getScrollBehavior() });
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  return true;
}

interface MarkdownComponentsOptions {
  /** Hidden text after links that open in a new tab */
  opensInNewTab: string;

  /** Called for `#hash` links, which never change the url of the page around the viewer */
  onHashLink: (hash: string) => void;

  /** Removes the Mantine styles of the code blocks */
  unstyled?: boolean;
}

/** react-markdown components: highlighted code blocks, and links that stay in the viewer or open a new tab */
export function createMarkdownComponents({
  opensInNewTab,
  onHashLink,
  unstyled,
}: MarkdownComponentsOptions) {
  return {
    pre: ({ node, children }: { node?: HastNode; children?: ReactNode }) => {
      const fenced = getFencedCode(node);
      return fenced ? (
        <CodeHighlight
          code={fenced.code}
          language={fenced.language ?? 'text'}
          radius="sm"
          my="md"
          unstyled={unstyled}
        />
      ) : (
        <pre>{children}</pre>
      );
    },

    a: ({
      node: _node,
      href,
      children,
      ...others
    }: ComponentPropsWithoutRef<'a'> & { node?: HastNode }) =>
      href?.startsWith('#') ? (
        <a
          href={href}
          onClick={(event) => {
            event.preventDefault();
            onHashLink(href.slice(1));
          }}
          {...others}
        >
          {children}
        </a>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" {...others}>
          {children}
          <VisuallyHidden> {opensInNewTab}</VisuallyHidden>
        </a>
      ),
  };
}
