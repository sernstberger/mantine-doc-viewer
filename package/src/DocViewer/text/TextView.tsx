import { ActionIcon, Tooltip } from '@mantine/core';
import React, { useState } from 'react';
import { useDocumentTitle, useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { WrapIcon } from '../icons';
import { TextStatus } from './TextStatus';
import { useTextDocument } from './use-text-document';
import { TOOLTIP_EVENTS } from '../a11y';

export function TextView() {
  const { getStyles, src, maxTextSize, labels } = useDocViewerContext();
  const title = useDocumentTitle();
  const state = useTextDocument(src, maxTextSize);
  const [wrap, setWrap] = useState(true);

  return (
    <>
      <DocViewerToolbar>
        {state.status === 'ready' && (
          <Tooltip events={TOOLTIP_EVENTS} label={wrap ? labels.doNotWrapLines : labels.wrapLines}>
            <ActionIcon
              variant={wrap ? 'light' : 'subtle'}
              color="gray"
              aria-label={labels.wrapLines}
              aria-pressed={wrap}
              onClick={() => setWrap((current) => !current)}
            >
              <WrapIcon />
            </ActionIcon>
          </Tooltip>
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
