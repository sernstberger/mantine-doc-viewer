import { CodeHighlight } from '@mantine/code-highlight';
import { Typography } from '@mantine/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar/ToolbarView';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { DocViewerMessage } from '../DocViewerMessage/MessageView';
import {
  importMarkdown,
  MarkdownModule,
} from '../DocViewerAdapterProvider/adapters/import-markdown';
import { createMarkdownComponents, scrollToHeading } from './markdown-components';
import { rehypeHeadingIds, resolveMarkdownUrl } from '../utils/markdown-utils';
import { printHtml, printText } from '../utils/print';
import { TextStatus } from '../DocViewerText/TextStatus';
import { useTextView } from '../hooks/text/use-text-view';
import { ViewModeToggle } from '../DocViewerViewModeControl/ViewModeToggle';
import { useDocViewerText } from '../hooks/text/use-doc-viewer-text';

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

  const components = useMemo(
    () =>
      createMarkdownComponents({
        opensInNewTab: labels.opensInNewTab,
        onHashLink: (hash) => rootRef.current && scrollToHeading(rootRef.current, hash),
      }),
    [labels]
  );

  // react-markdown parses and transforms the whole text on every render: only when it changes
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
        {labels.markdownError}
      </DocViewerMessage>
    );
  }

  if (!rendered) {
    return null;
  }

  return (
    <Typography ref={rootRef} {...getStyles('markdown')} data-markdown>
      {rendered}
    </Typography>
  );
}

export function MarkdownView() {
  const { getStyles, src, maxTextSize, labels, codeHighlightProps } = useDocViewerContext();
  const show = useShowControl();
  const state = useDocViewerText(src, maxTextSize);
  const [mode, setMode] = useState<'preview' | 'source'>('preview');
  const { fileName } = useDocViewerContext();
  const bodyRef = useRef<HTMLDivElement>(null);
  // Prints what is shown: the rendered markdown, or its source
  const onPrint = useTextView('markdown', state, async () => {
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
      <DocViewerToolbar onPrint={onPrint}>
        {state.status === 'ready' && show('viewMode') && (
          <ViewModeToggle
            value={mode}
            onChange={setMode}
            data={[
              { value: 'preview', label: labels.preview },
              { value: 'source', label: labels.source },
            ]}
            label={labels.markdownView}
          />
        )}
      </DocViewerToolbar>
      <DocViewerBody ref={bodyRef} focusable={state.status === 'ready'}>
        {state.status !== 'ready' && <TextStatus state={state} />}
        {state.status === 'ready' && mode === 'preview' && <MarkdownPreview text={state.text} />}
        {state.status === 'ready' && mode === 'source' && (
          <CodeHighlight
            code={state.text}
            language="markdown"
            withLineNumbers
            withFirstLineIndentation
            radius={0}
            {...codeHighlightProps}
            {...getStyles('code', {
              className: codeHighlightProps?.className,
              style: codeHighlightProps?.style,
            })}
          />
        )}
      </DocViewerBody>
    </>
  );
}
