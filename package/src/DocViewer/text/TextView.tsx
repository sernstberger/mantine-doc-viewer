import { ActionIcon } from '@mantine/core';
import React, { useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { WrapIcon } from '../icons';
import { printText } from '../print';
import { TextStatus } from './TextStatus';
import { useTextView } from './use-text-view';
import { useTextDocument } from './use-text-document';
import { DocViewerTooltip, useControlProps } from '../controls';

export function TextView() {
  const { getStyles, src, maxTextSize, labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  const state = useTextDocument(src, maxTextSize);
  const [wrap, setWrap] = useState(true);
  const { fileName } = useDocViewerContext();
  const onPrint = useTextView('text', state, async () => {
    state.status === 'ready' && (await printText(state.text, fileName));
  });

  return (
    <>
      <DocViewerToolbar onPrint={onPrint}>
        {state.status === 'ready' && (
          <DocViewerTooltip label={wrap ? labels.doNotWrapLines : labels.wrapLines}>
            <ActionIcon
              {...controlProps(wrap)}
              aria-label={labels.wrapLines}
              aria-pressed={wrap}
              onClick={() => setWrap((current) => !current)}
            >
              <WrapIcon />
            </ActionIcon>
          </DocViewerTooltip>
        )}
      </DocViewerToolbar>
      <div
        {...getStyles('body')}
        tabIndex={state.status === 'ready' ? 0 : undefined}
        role={state.status === 'ready' ? 'region' : undefined}
        aria-label={state.status === 'ready' ? title : undefined}
      >
        {state.status === 'ready' ? (
          <pre {...getStyles('text')} data-wrap={wrap || undefined}>
            {state.text}
          </pre>
        ) : (
          <TextStatus state={state} />
        )}
      </div>
    </>
  );
}
