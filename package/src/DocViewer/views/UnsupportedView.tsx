import React from 'react';
import type { DocType } from '../detect-doc-type';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { DocViewerMessage } from './MessageView';

export function UnsupportedView({ type }: { type: DocType }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <>
      <DocViewerToolbar />
      <div {...getStyles('body')}>
        <DocViewerMessage withDownload>
          {type === 'unknown' ? labels.unsupported : labels.notSupportedYet(type)}
        </DocViewerMessage>
      </div>
    </>
  );
}
