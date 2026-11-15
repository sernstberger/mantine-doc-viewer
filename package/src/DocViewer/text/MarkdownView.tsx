import { CodeHighlight } from '@mantine/code-highlight';
import { SegmentedControl, Typography } from '@mantine/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { DocViewerMessage } from '../views/MessageView';
import { importMarkdown, MarkdownModule } from './import-markdown';
import {
  createSlugger,
  getFencedCode,
  getText,
  HastNode,
  resolveMarkdownUrl,
} from './markdown-utils';
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

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
const HEADINGS: HeadingTag[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function MarkdownPreview({ text }: { text: string }) {
  const { getStyles, src } = useDocViewerContext();
  const { module, failed } = useMarkdownModule();
  const rootRef = useRef<HTMLDivElement>(null);

  // Links to a heading scroll the viewer instead of changing the url of the page around it
  const scrollToHeading = (event: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    const root = rootRef.current;
    const target = root?.querySelector<HTMLElement>(
      `[id="${CSS.escape(decodeURIComponent(hash))}"]`
    );
    const scrollContainer = root?.parentElement;
    if (!target || !scrollContainer) {
      return;
    }

    event.preventDefault();
    const top =
      target.getBoundingClientRect().top -
      scrollContainer.getBoundingClientRect().top +
      scrollContainer.scrollTop;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scrollContainer.scrollTo({ top: top - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  // Rebuilt for every text so that repeated headings are numbered from the start
  const components = useMemo(() => {
    const slug = createSlugger();
    const headings = Object.fromEntries(
      HEADINGS.map((Tag) => [
        Tag,
        ({ node, children }: { node?: HastNode; children?: React.ReactNode }) => (
          <Tag id={node ? slug(getText(node)) : undefined}>{children}</Tag>
        ),
      ])
    );

    return {
      ...headings,
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
        ...others
      }: React.ComponentPropsWithoutRef<'a'> & { node?: HastNode }) =>
        href?.startsWith('#') ? (
          <a href={href} onClick={(event) => scrollToHeading(event, href.slice(1))} {...others} />
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" {...others} />
        ),
    };
  }, [text]);

  if (failed) {
    return <DocViewerMessage withDownload>Markdown preview could not be loaded</DocViewerMessage>;
  }

  if (!module) {
    return null;
  }

  const { Markdown, remarkGfm, defaultUrlTransform } = module;

  return (
    <Typography ref={rootRef} {...getStyles('markdown')}>
      <Markdown
        remarkPlugins={[remarkGfm]}
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
  const { getStyles, src, maxTextSize } = useDocViewerContext();
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
              { value: 'preview', label: 'Preview' },
              { value: 'source', label: 'Source' },
            ]}
            aria-label="Markdown view"
          />
        )}
      </DocViewerToolbar>
      <div {...getStyles('body')}>
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
