import { CodeHighlight, JsonViewer } from '@mantine/code-highlight';
import { SegmentedControl } from '@mantine/core';
import React, { useMemo, useState } from 'react';
import { getCodeLanguage } from '../detect-doc-type';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { printText } from '../print';
import { TextStatus } from './TextStatus';
import { useTextView } from './use-text-view';
import { useTextDocument } from './use-text-document';

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

export function CodeView() {
  const { getStyles, src, fileName, language, maxTextSize, labels, size, codeHighlightProps } =
    useDocViewerContext();
  const title = useDocumentTitle();
  const state = useTextDocument(src, maxTextSize);
  const resolvedLanguage = language ?? getCodeLanguage({ src, fileName }) ?? 'text';
  const text = state.status === 'ready' ? state.text : null;

  // Valid JSON can also be shown as a collapsible tree
  const json = useMemo(
    () => (text !== null && resolvedLanguage === 'json' ? parseJson(text) : NOT_JSON),
    [text, resolvedLanguage]
  );
  const [mode, setMode] = useState<'tree' | 'code'>('tree');
  const showTree = json !== NOT_JSON && mode === 'tree';
  const onPrint = useTextView('code', state, async () => {
    text !== null && (await printText(text, fileName));
  });

  return (
    <>
      <DocViewerToolbar onPrint={onPrint}>
        {json !== NOT_JSON && (
          <SegmentedControl
            size={size.input}
            value={mode}
            onChange={(value) => setMode(value as 'tree' | 'code')}
            data={[
              { value: 'tree', label: labels.tree },
              { value: 'code', label: labels.code },
            ]}
            aria-label={labels.jsonView}
          />
        )}
      </DocViewerToolbar>
      <div
        {...getStyles('body')}
        tabIndex={state.status === 'ready' ? 0 : undefined}
        role={state.status === 'ready' ? 'region' : undefined}
        aria-label={state.status === 'ready' ? title : undefined}
      >
        {text === null && <TextStatus state={state} />}
        {text !== null && showTree && (
          <JsonViewer value={json} defaultExpandDepth={2} {...getStyles('code')} />
        )}
        {text !== null && !showTree && (
          <CodeHighlight
            code={text}
            language={resolvedLanguage}
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
      </div>
    </>
  );
}
