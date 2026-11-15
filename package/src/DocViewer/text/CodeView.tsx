import { CodeHighlight, JsonViewer } from '@mantine/code-highlight';
import { SegmentedControl } from '@mantine/core';
import React, { useMemo, useState } from 'react';
import { getCodeLanguage } from '../detect-doc-type';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { TextStatus } from './TextStatus';
import { useTextDocument } from './use-text-document';

const NOT_JSON = Symbol('not-json');

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return NOT_JSON;
  }
}

export function CodeView() {
  const { getStyles, src, fileName, language, maxTextSize } = useDocViewerContext();
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

  return (
    <>
      <DocViewerToolbar>
        {json !== NOT_JSON && (
          <SegmentedControl
            size="xs"
            value={mode}
            onChange={(value) => setMode(value as 'tree' | 'code')}
            data={[
              { value: 'tree', label: 'Tree' },
              { value: 'code', label: 'Code' },
            ]}
            aria-label="JSON view"
          />
        )}
      </DocViewerToolbar>
      <div {...getStyles('body')}>
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
            {...getStyles('code')}
          />
        )}
      </div>
    </>
  );
}
