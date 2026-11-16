import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerLoading } from '../DocViewerLoading/DocViewerLoading';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';
import type { DocViewerTextProps } from './DocViewerText';
import { formatFileSize, DocViewerTextState } from '../hooks/text/use-doc-viewer-text';

/** Loading, error and too-large messages shared by the text, code and markdown views */
export function TextStatus({
  state,
  classNames,
  styles,
}: Pick<DocViewerTextProps, 'classNames' | 'styles'> & { state: DocViewerTextState }) {
  const { labels, locale } = useDocViewerContext();

  if (state.status === 'loading') {
    return <DocViewerLoading classNames={classNames} styles={styles} />;
  }

  if (state.status === 'too-large') {
    return (
      <DocViewerMessage withDownload error classNames={classNames} styles={styles}>
        {labels.tooLargeLabel(formatFileSize(state.size, locale))}
      </DocViewerMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <DocViewerMessage withDownload error classNames={classNames} styles={styles}>
        {labels.textErrorLabel}
      </DocViewerMessage>
    );
  }

  return null;
}
