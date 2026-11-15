import { CodeHighlight } from '@mantine/code-highlight';
import { Typography } from '@mantine/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';
import { useDocViewerAdapters } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import type { DocViewerMarkdownEngine } from '../DocViewerAdapterProvider/adapters/react-markdown-adapter';
import { createMarkdownComponents, scrollToHeading } from './markdown-components';
import { rehypeHeadingIds, resolveMarkdownUrl } from '../utils/markdown-utils';
import { printHtml, printText } from '../utils/print';
import { TextStatus } from '../DocViewerText/TextStatus';
import { useTextView } from '../hooks/text/use-text-view';
import { useViewModeAvailable } from '../hooks/text/use-view-mode-available';
import { DEFAULT_MAX_TEXT_SIZE, useDocViewerText } from '../hooks/text/use-doc-viewer-text';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import type { DocViewerMarkdownProps } from './DocViewerMarkdown';

/** Prints what is shown: the rendered markdown in preview, otherwise the source */
export function getMarkdownPrintSource(
  mode: 'preview' | 'source',
  renderedHtml: string | undefined,
  text: string | null
): { html?: string; text?: string } | null {
  if (mode === 'preview' && renderedHtml !== undefined) {
    return { html: renderedHtml };
  }
  return text === null ? null : { text };
}

function useMarkdownModule() {
  const { markdown } = useDocViewerAdapters();
  const [module, setModule] = useState<DocViewerMarkdownEngine | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    markdown!.load().then(
      (loaded) => !cancelled && setModule(loaded),
      () => !cancelled && setFailed(true)
    );
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  return { module, failed };
}

function MarkdownPreview({
  text,
  classNames,
  styles,
}: Pick<DocViewerMarkdownProps, 'classNames' | 'styles'> & { text: string }) {
  const { getStyles, src, labels } = useDocViewerContext();
  const { module, failed } = useMarkdownModule();
  const rootRef = useRef<HTMLDivElement>(null);

  const components = useMemo(
    () =>
      createMarkdownComponents({
        opensInNewTab: labels.opensInNewTabLabel,
        onHashLink: (hash) => rootRef.current && scrollToHeading(rootRef.current, hash),
      }),
    [labels]
  );

  const rendered = useMemo(() => {
    if (!module) {
      return null;
    }

    const { Markdown, remarkGfm, defaultUrlTransform } = module;
    return (
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
    );
  }, [module, text, components, src]);

  if (failed) {
    return (
      <DocViewerMessage withDownload error>
        {labels.markdownErrorLabel}
      </DocViewerMessage>
    );
  }

  if (!rendered) {
    return null;
  }

  return (
    <Typography ref={rootRef} {...getStyles('markdown', { classNames, styles })} data-markdown>
      {rendered}
    </Typography>
  );
}

export function MarkdownView({
  maxSize,
  codeHighlightProps,
  vars,
  ...others
}: DocViewerMarkdownProps) {
  const { classNames, styles } = others;
  const { getStyles, src, store, fileName } = useDocViewerContext();
  const state = useDocViewerText(src, maxSize ?? DEFAULT_MAX_TEXT_SIZE);
  const mode = useDocViewerState(store, (current) => current.viewMode);
  useViewModeAvailable(store, state.status === 'ready');
  const bodyRef = useRef<HTMLDivElement>(null);
  useTextView('markdown', state, async () => {
    const source = getMarkdownPrintSource(
      mode,
      bodyRef.current?.querySelector('[data-markdown]')?.innerHTML,
      state.status === 'ready' ? state.text : null
    );
    if (source?.html !== undefined) {
      await printHtml(source.html, fileName);
    } else if (source?.text !== undefined) {
      await printText(source.text, fileName);
    }
  });

  return (
    <>
      <DocViewerBody ref={bodyRef} focusable={state.status === 'ready'} {...others}>
        {state.status !== 'ready' && (
          <TextStatus state={state} classNames={classNames} styles={styles} />
        )}
        {state.status === 'ready' && mode === 'preview' && (
          <MarkdownPreview text={state.text} classNames={classNames} styles={styles} />
        )}
        {state.status === 'ready' && mode === 'source' && (
          <CodeHighlight
            code={state.text}
            language="markdown"
            withLineNumbers
            withFirstLineIndentation
            radius={0}
            {...codeHighlightProps}
            {...getStyles('code', {
              classNames,
              styles,
              className: codeHighlightProps?.className,
              style: codeHighlightProps?.style,
            })}
          />
        )}
      </DocViewerBody>
    </>
  );
}
