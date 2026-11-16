import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerBody } from '../DocViewerBody/DocViewerBody';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { printText } from '../utils/print';
import { TextStatus } from './TextStatus';
import { useTextView } from '../hooks/text/use-text-view';
import { DEFAULT_MAX_TEXT_SIZE, useDocViewerText } from '../hooks/text/use-doc-viewer-text';
import type { DocViewerTextProps } from './DocViewerText';

export function TextView({ maxSize, vars, ...others }: DocViewerTextProps) {
  const { classNames, styles } = others;
  const { getStyles, src, store, fileName } = useDocViewerContext();
  const state = useDocViewerText(src, maxSize ?? DEFAULT_MAX_TEXT_SIZE);
  const wrap = useDocViewerState(store, (current) => current.textWrap);
  useTextView('text', state, async () => {
    state.status === 'ready' && (await printText(state.text, fileName));
  });

  return (
    <>
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
