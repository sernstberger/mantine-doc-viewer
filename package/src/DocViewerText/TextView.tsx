import { ActionIcon } from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { ToolbarView } from '../DocViewerToolbar/ToolbarView';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { useDocViewerStateValue } from '../hooks/use-doc-viewer-state';
import { WrapIcon } from '../utils/icons';
import { printText } from '../utils/print';
import { TextStatus } from './TextStatus';
import { useTextView } from '../hooks/text/use-text-view';
import { useDocViewerText } from '../hooks/text/use-doc-viewer-text';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import type { DocViewerTextProps } from './DocViewerText';

export function TextView({ maxSize, vars, ...others }: DocViewerTextProps) {
  const { classNames, styles } = others;
  const { getStyles, src, store, maxTextSize, labels, fileName } = useDocViewerContext();
  const controlProps = useControlProps();
  const show = useShowControl();
  const state = useDocViewerText(src, maxSize ?? maxTextSize);
  const [wrap, setWrap] = useDocViewerStateValue(store, 'textWrap');
  const onPrint = useTextView('text', state, async () => {
    state.status === 'ready' && (await printText(state.text, fileName));
  });

  return (
    <>
      <ToolbarView onPrint={onPrint}>
        {state.status === 'ready' && show('wrap') && (
          <DocViewerTooltip label={wrap ? labels.doNotWrapLinesLabel : labels.wrapLinesLabel}>
            <ActionIcon
              {...controlProps(wrap)}
              aria-label={labels.wrapLinesLabel}
              aria-pressed={wrap}
              onClick={() => setWrap((current) => !current)}
            >
              <WrapIcon />
            </ActionIcon>
          </DocViewerTooltip>
        )}
      </ToolbarView>
      <DocViewerBody focusable={state.status === 'ready'} {...others}>
        {state.status === 'ready' ? (
          <pre {...getStyles('text', { classNames, styles })} data-wrap={wrap || undefined}>
            {state.text}
          </pre>
        ) : (
          <TextStatus state={state} classNames={classNames} styles={styles} />
        )}
      </DocViewerBody>
    </>
  );
}
