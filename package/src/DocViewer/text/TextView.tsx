import { ActionIcon, Tooltip } from '@mantine/core';
import React, { useState } from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { WrapIcon } from '../icons';
import { TextStatus } from './TextStatus';
import { useTextDocument } from './use-text-document';

export function TextView() {
  const { getStyles, src, maxTextSize } = useDocViewerContext();
  const state = useTextDocument(src, maxTextSize);
  const [wrap, setWrap] = useState(true);

  return (
    <>
      <DocViewerToolbar>
        {state.status === 'ready' && (
          <Tooltip label={wrap ? 'Do not wrap lines' : 'Wrap lines'}>
            <ActionIcon
              variant={wrap ? 'light' : 'subtle'}
              color="gray"
              aria-label="Wrap lines"
              aria-pressed={wrap}
              onClick={() => setWrap((current) => !current)}
            >
              <WrapIcon />
            </ActionIcon>
          </Tooltip>
        )}
      </DocViewerToolbar>
      <div {...getStyles('body')}>
        {state.status === 'ready' ? (
          <pre {...getStyles('text')} data-wrap={wrap || undefined} tabIndex={0}>
            {state.text}
          </pre>
        ) : (
          <TextStatus state={state} />
        )}
      </div>
    </>
  );
}
