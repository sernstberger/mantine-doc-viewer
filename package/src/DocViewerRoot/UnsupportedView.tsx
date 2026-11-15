import React from 'react';
import type { DocViewerType } from '../utils/get-doc-viewer-type';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerMessage } from '../DocViewerMessage/DocViewerMessage';

export function UnsupportedView({ type }: { type: DocViewerType }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <div {...getStyles('body')}>
      <DocViewerMessage withDownload>
        {type === 'pdf' ? labels.pdfNotConfiguredLabel : labels.unsupportedLabel}
      </DocViewerMessage>
    </div>
  );
}
