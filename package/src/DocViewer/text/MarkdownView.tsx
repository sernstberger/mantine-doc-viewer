import { CodeHighlight } from '@mantine/code-highlight';
import { SegmentedControl, Typography, VisuallyHidden } from '@mantine/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { DocViewerMessage } from '../views/MessageView';
import { importMarkdown, MarkdownModule } from './import-markdown';
import { getFencedCode, HastNode, rehypeHeadingIds, resolveMarkdownUrl } from './markdown-utils';
import { TextStatus } from './TextStatus';
import { useTextDocument } from './use-text-document';

function useMarkdownModule() {
  const [module, setModule] = useState<MarkdownModule | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    importMarkdown().then(
      (loaded) => !cancelled && setModule(loaded),
      () => !cancelled && setFailed(true)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { module, failed };
}

function MarkdownPreview({ text }: { text: string }) {
  const { getStyles, src, labels } = useDocViewerContext();
  const { module, failed } = useMarkdownModule();
  const rootRef = useRef<HTMLDivElement>(null);

  // Links to a heading scroll the viewer instead of changing the url of the page around it
  const scrollToHeading = (event: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    // Never change the url of the page around the viewer, even when the heading does not exist
    event.preventDefault();
    const root = rootRef.current;
    const target = root?.querySelector<HTMLElement>(
      `[id="${CSS.escape(decodeURIComponent(hash))}"]`
    );
    const scrollContainer = root?.parentElement;
    if (!target || !scrollContainer) {
      return;
    }

    const top =
      target.getBoundingClientRect().top -
      scrollContainer.getBoundingClientRect().top +
      scrollContainer.scrollTop;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scrollContainer.scrollTo({ top: top - 12, behavior: reduceMotion ? 'auto' : 'smooth' });

    // Move focus too, so keyboard and screen reader users continue from the heading
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  };

  const components = useMemo(
    () => ({
      pre: ({ node, children }: { node?: HastNode; children?: React.ReactNode }) => {
        const fenced = getFencedCode(node);
        return fenced ? (
          <CodeHighlight
            code={fenced.code}
            language={fenced.language ?? 'text'}
            radius="sm"
            my="md"
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
      }: React.ComponentPropsWithoutRef<'a'> & { node?: HastNode }) =>
        href?.startsWith('#') ? (
          <a href={href} onClick={(event) => scrollToHeading(event, href.slice(1))} {...others}>
            {children}
          </a>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" {...others}>
            {children}
            <VisuallyHidden> {labels.opensInNewTab}</VisuallyHidden>
          </a>
        ),
    }),
    [labels]
  );

  if (failed) {
    return (
      <DocViewerMessage withDownload error>
        {labels.markdownError}
      </DocViewerMessage>
    );
  }

  if (!module) {
    return null;
  }

  const { Markdown, remarkGfm, defaultUrlTransform } = module;

  return (
    <Typography ref={rootRef} {...getStyles('markdown')}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHeadingIds]}
        components={components}
        skipHtml
        urlTransform={(url: string) =>
          defaultUrlTransform(resolveMarkdownUrl(url, src, window.location.href))
        }
      >
        {text}
      </Markdown>
    </Typography>
  );
}

export function MarkdownView() {
  const { getStyles, src, maxTextSize, labels } = useDocViewerContext();
  const title = useDocumentTitle();
  const state = useTextDocument(src, maxTextSize);
  const [mode, setMode] = useState<'preview' | 'source'>('preview');

  return (
    <>
      <DocViewerToolbar>
        {state.status === 'ready' && (
          <SegmentedControl
            size="xs"
            value={mode}
            onChange={(value) => setMode(value as 'preview' | 'source')}
            data={[
              { value: 'preview', label: labels.preview },
              { value: 'source', label: labels.source },
            ]}
            aria-label={labels.markdownView}
          />
        )}
      </DocViewerToolbar>
      <div
        {...getStyles('body')}
        tabIndex={state.status === 'ready' ? 0 : undefined}
        role={state.status === 'ready' ? 'region' : undefined}
        aria-label={state.status === 'ready' ? title : undefined}
      >
        {state.status !== 'ready' && <TextStatus state={state} />}
        {state.status === 'ready' && mode === 'preview' && <MarkdownPreview text={state.text} />}
        {state.status === 'ready' && mode === 'source' && (
          <CodeHighlight
            code={state.text}
            language="markdown"
            withLineNumbers
            withFirstLineIndentation
            radius={0}
            {...getStyles('code')}
          />
        )}
      </div>
    </>
  );
}
