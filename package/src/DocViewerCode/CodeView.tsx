import { CodeHighlight, JsonViewer } from '@mantine/code-highlight';
import React, { useMemo } from 'react';
import { getCodeLanguage } from '../utils/get-doc-viewer-type';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { printText } from '../utils/print';
import { TextStatus } from '../DocViewerText/TextStatus';
import { useTextView } from '../hooks/text/use-text-view';
import { useViewModeAvailable } from '../hooks/text/use-view-mode-available';
import { useDocViewerText } from '../hooks/text/use-doc-viewer-text';
import type { DocViewerCodeProps } from './DocViewerCode';

const NOT_JSON = Symbol('not-json');

/** Integers past 2^53 lose digits in JSON.parse, so such files are only shown as code */
const UNSAFE_INTEGER = /[[:,]\s*-?\d{16,}\s*[,\]}]/;

function parseJson(text: string) {
  if (UNSAFE_INTEGER.test(text)) {
    return NOT_JSON;
  }

  try {
    return JSON.parse(text);
  } catch {
    return NOT_JSON;
  }
}

export function CodeView({
  maxSize,
  language,
  codeHighlightProps,
  vars,
  ...others
}: DocViewerCodeProps) {
  const { classNames, styles } = others;
  const ctx = useDocViewerContext();
  const { getStyles, src, fileName, store } = ctx;
  const state = useDocViewerText(src, maxSize ?? ctx.maxTextSize);
  const resolvedLanguage = language ?? ctx.language ?? getCodeLanguage({ src, fileName }) ?? 'text';
  const highlightProps = codeHighlightProps ?? ctx.codeHighlightProps;
  const text = state.status === 'ready' ? state.text : null;

  const json = useMemo(
    () => (text !== null && resolvedLanguage === 'json' ? parseJson(text) : NOT_JSON),
    [text, resolvedLanguage]
  );
  const viewMode = useDocViewerState(store, (current) => current.viewMode);
  useViewModeAvailable(store, json !== NOT_JSON);
  const showTree = json !== NOT_JSON && viewMode === 'preview';
  useTextView('code', state, async () => {
    text !== null && (await printText(text, fileName));
  });

  return (
    <>
      <DocViewerBody focusable={state.status === 'ready'} {...others}>
        {text === null && <TextStatus state={state} classNames={classNames} styles={styles} />}
        {text !== null && showTree && (
          <JsonViewer
            value={json}
            defaultExpandDepth={2}
            {...getStyles('code', { classNames, styles })}
          />
        )}
        {text !== null && !showTree && (
          <CodeHighlight
            code={text}
            language={resolvedLanguage}
            withLineNumbers
            withFirstLineIndentation
            radius={0}
            {...highlightProps}
            {...getStyles('code', {
              classNames,
              styles,
              className: highlightProps?.className,
              style: highlightProps?.style,
            })}
          />
        )}
      </DocViewerBody>
    </>
  );
}
